#!/usr/bin/env python3
from __future__ import annotations

import cgi
import json
import os
import posixpath
import re
import secrets
import shutil
import sys
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = ROOT_DIR / "uploads"
COLLECTIONS = {
  "documents": {
    "metadata": UPLOADS_DIR / "documents.json",
    "folder": UPLOADS_DIR / "documents",
  },
  "use-cases": {
    "metadata": UPLOADS_DIR / "use-cases.json",
    "folder": UPLOADS_DIR / "use-cases",
  },
}
SESSION_COOKIE_NAME = "medchain_admin_session"
ADMIN_PASSWORD = os.environ.get("MEDCHAIN_ADMIN_PASSWORD", "medchain-admin")
ACTIVE_SESSIONS: set[str] = set()


def ensure_storage() -> None:
  UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
  for config in COLLECTIONS.values():
    config["folder"].mkdir(parents=True, exist_ok=True)
    if not config["metadata"].exists():
      config["metadata"].write_text("[]", encoding="utf-8")


def load_metadata(collection: str) -> list[dict]:
  ensure_storage()
  metadata_path = COLLECTIONS[collection]["metadata"]
  try:
    return json.loads(metadata_path.read_text(encoding="utf-8"))
  except json.JSONDecodeError:
    return []


def save_metadata(collection: str, records: list[dict]) -> None:
  ensure_storage()
  metadata_path = COLLECTIONS[collection]["metadata"]
  metadata_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


def safe_filename(name: str) -> str:
  stem, dot, suffix = name.rpartition(".")
  if not stem:
    stem = suffix
    suffix = ""
  safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip("-") or "document"
  safe_suffix = re.sub(r"[^A-Za-z0-9]+", "", suffix)[:10]
  return f"{safe_stem}.{safe_suffix}" if safe_suffix else safe_stem


class MedChainHandler(SimpleHTTPRequestHandler):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

  def do_GET(self) -> None:
    parsed = urlparse(self.path)
    if parsed.path == "/api/documents":
      self.handle_list_documents("documents")
      return
    if parsed.path == "/api/use-cases":
      self.handle_list_documents("use-cases")
      return
    if parsed.path == "/api/admin/session":
      self.handle_admin_session()
      return
    super().do_GET()

  def do_POST(self) -> None:
    parsed = urlparse(self.path)
    if parsed.path == "/api/documents":
      self.handle_upload_documents("documents")
      return
    if parsed.path == "/api/use-cases":
      self.handle_upload_documents("use-cases")
      return
    if parsed.path == "/api/admin/login":
      self.handle_admin_login()
      return
    if parsed.path == "/api/admin/logout":
      self.handle_admin_logout()
      return
    self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

  def do_DELETE(self) -> None:
    parsed = urlparse(self.path)
    if parsed.path.startswith("/api/documents/"):
      self.handle_delete_document("documents", parsed.path.rsplit("/", 1)[-1])
      return
    if parsed.path.startswith("/api/use-cases/"):
      self.handle_delete_document("use-cases", parsed.path.rsplit("/", 1)[-1])
      return
    self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

  def translate_path(self, path: str) -> str:
    parsed = urlparse(path)
    path = posixpath.normpath(unquote(parsed.path))
    words = [word for word in path.split("/") if word]
    current = ROOT_DIR
    for word in words:
      if word in {os.curdir, os.pardir}:
        continue
      current = current / word
    return str(current)

  def handle_list_documents(self, collection: str) -> None:
    records = load_metadata(collection)
    records.sort(key=lambda item: item.get("createdAt", ""), reverse=True)
    self.send_json(records)

  def handle_admin_session(self) -> None:
    self.send_json({"authenticated": self.is_admin_authenticated()})

  def handle_admin_login(self) -> None:
    content_length = int(self.headers.get("Content-Length", "0") or "0")
    raw = self.rfile.read(content_length) if content_length > 0 else b"{}"
    try:
      payload = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
      self.send_json({"error": "Invalid JSON"}, status=HTTPStatus.BAD_REQUEST)
      return

    password = payload.get("password", "")
    if password != ADMIN_PASSWORD:
      self.send_json({"error": "Invalid password"}, status=HTTPStatus.UNAUTHORIZED)
      return

    token = secrets.token_urlsafe(24)
    ACTIVE_SESSIONS.add(token)
    self.send_json(
      {"authenticated": True},
      headers={"Set-Cookie": self.build_session_cookie(token)},
    )

  def handle_admin_logout(self) -> None:
    token = self.get_session_token()
    if token and token in ACTIVE_SESSIONS:
      ACTIVE_SESSIONS.discard(token)
    self.send_json(
      {"authenticated": False},
      headers={"Set-Cookie": self.build_expired_cookie()},
    )

  def handle_upload_documents(self, collection: str) -> None:
    if not self.is_admin_authenticated():
      self.send_json({"error": "Admin authentication required"}, status=HTTPStatus.UNAUTHORIZED)
      return
    ensure_storage()
    content_type = self.headers.get("Content-Type", "")
    if "multipart/form-data" not in content_type:
      self.send_json({"error": "Expected multipart/form-data"}, status=HTTPStatus.BAD_REQUEST)
      return

    form = cgi.FieldStorage(
      fp=self.rfile,
      headers=self.headers,
      environ={
        "REQUEST_METHOD": "POST",
        "CONTENT_TYPE": content_type,
      },
    )

    fields = form["files"] if "files" in form else []
    items = fields if isinstance(fields, list) else [fields]
    items = [item for item in items if getattr(item, "filename", None)]

    if not items:
      self.send_json({"error": "No files uploaded"}, status=HTTPStatus.BAD_REQUEST)
      return

    records = load_metadata(collection)
    created_records: list[dict] = []
    collection_folder = COLLECTIONS[collection]["folder"]

    for item in items:
      original_name = Path(item.filename).name
      document_id = str(uuid.uuid4())
      stored_name = f"{document_id}-{safe_filename(original_name)}"
      target_path = collection_folder / stored_name

      with target_path.open("wb") as target:
        shutil.copyfileobj(item.file, target)

      size = target_path.stat().st_size
      record = {
        "id": document_id,
        "name": original_name,
        "type": item.type or "application/octet-stream",
        "size": size,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "collection": collection,
        "storedName": stored_name,
        "url": f"/uploads/{collection}/{stored_name}",
      }
      records.append(record)
      created_records.append(record)

    save_metadata(collection, records)
    self.send_json(created_records, status=HTTPStatus.CREATED)

  def handle_delete_document(self, collection: str, document_id: str) -> None:
    if not self.is_admin_authenticated():
      self.send_json({"error": "Admin authentication required"}, status=HTTPStatus.UNAUTHORIZED)
      return
    records = load_metadata(collection)
    kept_records = []
    removed_record = None

    for record in records:
      if record.get("id") == document_id:
        removed_record = record
      else:
        kept_records.append(record)

    if removed_record is None:
      self.send_json({"error": "Document not found"}, status=HTTPStatus.NOT_FOUND)
      return

    file_path = COLLECTIONS[collection]["folder"] / removed_record["storedName"]
    if file_path.exists():
      file_path.unlink()

    save_metadata(collection, kept_records)
    self.send_json({"deleted": document_id})

  def get_session_token(self) -> str | None:
    raw_cookie = self.headers.get("Cookie", "")
    for part in raw_cookie.split(";"):
      name, _, value = part.strip().partition("=")
      if name == SESSION_COOKIE_NAME and value:
        return value
    return None

  def is_admin_authenticated(self) -> bool:
    token = self.get_session_token()
    return bool(token and token in ACTIVE_SESSIONS)

  def build_session_cookie(self, token: str) -> str:
    return (
      f"{SESSION_COOKIE_NAME}={token}; Path=/; HttpOnly; SameSite=Lax"
    )

  def build_expired_cookie(self) -> str:
    return (
      f"{SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
    )

  def send_json(self, payload, status: int = HTTPStatus.OK, headers: dict[str, str] | None = None) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    self.send_response(status)
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Content-Length", str(len(body)))
    if headers:
      for key, value in headers.items():
        self.send_header(key, value)
    self.end_headers()
    self.wfile.write(body)


def main() -> int:
  ensure_storage()
  port = 4173
  if len(sys.argv) > 1:
    port = int(sys.argv[1])
  server = ThreadingHTTPServer(("127.0.0.1", port), MedChainHandler)
  print(f"Serving MedChain on http://127.0.0.1:{port}")
  try:
    server.serve_forever()
  except KeyboardInterrupt:
    pass
  finally:
    server.server_close()
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
