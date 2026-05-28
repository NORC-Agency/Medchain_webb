import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type CollectionName = "documents" | "use-cases";

export type StoredRecord = {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  collection: CollectionName;
  storedName: string;
  url: string;
};

type BlobSdk = typeof import("@vercel/blob");
type StoredFilePayload =
  | {
      record: StoredRecord;
      buffer: Buffer;
    }
  | {
      record: StoredRecord;
      stream: ReadableStream<Uint8Array>;
      contentType: string;
      size: number;
    };

const ROOT_DIR = process.cwd();
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const USE_BLOB_STORAGE = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const COLLECTIONS: Record<CollectionName, { metadata: string; folder: string }> = {
  documents: {
    metadata: path.join(UPLOADS_DIR, "documents.json"),
    folder: path.join(UPLOADS_DIR, "documents"),
  },
  "use-cases": {
    metadata: path.join(UPLOADS_DIR, "use-cases.json"),
    folder: path.join(UPLOADS_DIR, "use-cases"),
  },
};

let cachedBlobSdk: BlobSdk | null = null;

const MIME_TYPES: Record<string, string> = {
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".md": "text/markdown",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function safeFilename(name: string) {
  const ext = path.extname(name).replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
  const stem =
    path
      .basename(name, path.extname(name))
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "document";

  return ext ? `${stem}.${ext}` : stem;
}

function buildInternalFileUrl(collection: CollectionName, storedName: string) {
  const segments = storedName.split("/").map((segment) => encodeURIComponent(segment));
  return `/api/files/${collection}/${segments.join("/")}`;
}

function normalizeRecord(collection: CollectionName, record: Partial<StoredRecord>): StoredRecord {
  const storedName = record.storedName ?? "";
  const localUrl = storedName ? buildInternalFileUrl(collection, storedName) : "";
  return {
    id: record.id ?? randomUUID(),
    name: record.name ?? "Unknown file",
    type: record.type ?? "application/octet-stream",
    size: record.size ?? 0,
    createdAt: record.createdAt ?? new Date().toISOString(),
    collection,
    storedName,
    url: localUrl,
  };
}

function manifestPathname(collection: CollectionName) {
  return `manifests/${collection}.json`;
}

function inferMimeType(filename: string) {
  return MIME_TYPES[path.extname(filename).toLowerCase()] ?? "application/octet-stream";
}

function blobRecordFromStoredName(
  collection: CollectionName,
  storedName: string,
  options?: {
    size?: number;
    createdAt?: string;
    type?: string;
  },
) {
  const [, idSegment, ...nameSegments] = storedName.split("/");
  const name = decodeURIComponent(nameSegments.join("/") || "file");

  return normalizeRecord(collection, {
    id: idSegment || storedName,
    storedName,
    name,
    type: options?.type ?? inferMimeType(name),
    size: options?.size ?? 0,
    createdAt: options?.createdAt,
  });
}

async function getBlobSdk() {
  if (!cachedBlobSdk) {
    cachedBlobSdk = await import("@vercel/blob");
  }

  return cachedBlobSdk;
}

async function ensureLocalStorage() {
  await mkdir(UPLOADS_DIR, { recursive: true });

  for (const config of Object.values(COLLECTIONS)) {
    await mkdir(config.folder, { recursive: true });
    try {
      await stat(config.metadata);
    } catch {
      await writeFile(config.metadata, "[]", "utf8");
    }
  }
}

function getCollectionConfig(collection: CollectionName) {
  return COLLECTIONS[collection];
}

export function isCollectionName(value: string): value is CollectionName {
  return value === "documents" || value === "use-cases";
}

export function ensureWritableStorage() {
  if (!USE_BLOB_STORAGE && process.env.VERCEL) {
    throw new Error("Blob storage is not configured for this Vercel deployment.");
  }
}

async function listLocalRecords(collection: CollectionName) {
  await ensureLocalStorage();
  const { metadata } = getCollectionConfig(collection);

  try {
    const contents = await readFile(metadata, "utf8");
    const records = (JSON.parse(contents) as Partial<StoredRecord>[]).map((record) =>
      normalizeRecord(collection, record),
    );
    return records.sort(
      (left, right) => Date.parse(right.createdAt || "") - Date.parse(left.createdAt || ""),
    );
  } catch {
    return [] as StoredRecord[];
  }
}

async function saveLocalRecords(collection: CollectionName, records: StoredRecord[]) {
  await ensureLocalStorage();
  const { metadata } = getCollectionConfig(collection);
  await writeFile(metadata, JSON.stringify(records, null, 2), "utf8");
}

async function readBlobManifest(collection: CollectionName) {
  const { get } = await getBlobSdk();

  try {
    const manifestBlob = await get(manifestPathname(collection), { access: "private" });
    if (!manifestBlob || manifestBlob.statusCode !== 200 || !manifestBlob.stream) {
      return [] as StoredRecord[];
    }

    const contents = await new Response(manifestBlob.stream).text();
    const records = JSON.parse(contents) as Partial<StoredRecord>[];
    return records
      .map((record) => normalizeRecord(collection, record))
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  } catch {
    return [] as StoredRecord[];
  }
}

async function saveBlobManifest(collection: CollectionName, records: StoredRecord[]) {
  const { put } = await getBlobSdk();
  await put(manifestPathname(collection), JSON.stringify(records, null, 2), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: 60,
  });
}

export async function listRecords(collection: CollectionName) {
  if (USE_BLOB_STORAGE) {
    const { list } = await getBlobSdk();
    const blobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
    let cursor: string | undefined;

    do {
      const response = await list({
        prefix: `${collection}/`,
        cursor,
        limit: 1000,
      });

      blobs.push(...response.blobs);
      cursor = response.hasMore ? response.cursor : undefined;
    } while (cursor);

    return blobs
      .map((blob) =>
        blobRecordFromStoredName(collection, blob.pathname, {
          size: blob.size,
          createdAt: blob.uploadedAt.toISOString(),
        }),
      )
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  }

  return listLocalRecords(collection);
}

async function uploadLocalFiles(collection: CollectionName, files: File[]) {
  await ensureLocalStorage();
  const records = await listLocalRecords(collection);
  const { folder } = getCollectionConfig(collection);
  const createdRecords: StoredRecord[] = [];

  for (const file of files) {
    const id = randomUUID();
    const storedName = `${id}-${safeFilename(file.name)}`;
    const targetPath = path.join(folder, storedName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(targetPath, bytes);

    const record: StoredRecord = {
      id,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: bytes.byteLength,
      createdAt: new Date().toISOString(),
      collection,
      storedName,
      url: `/api/files/${collection}/${encodeURIComponent(storedName)}`,
    };

    records.push(record);
    createdRecords.push(record);
  }

  await saveLocalRecords(collection, records);
  return createdRecords;
}

async function uploadBlobFiles(collection: CollectionName, files: File[]) {
  const { put } = await getBlobSdk();
  const createdRecords: StoredRecord[] = [];

  for (const file of files) {
    const id = randomUUID();
    const blob = await put(`${collection}/${id}/${safeFilename(file.name)}`, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type || "application/octet-stream",
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });

    const record: StoredRecord = {
      id,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      createdAt: new Date().toISOString(),
      collection,
      storedName: blob.pathname,
      url: buildInternalFileUrl(collection, blob.pathname),
    };

    createdRecords.push(record);
  }
  return createdRecords;
}

export async function uploadFiles(collection: CollectionName, files: File[]) {
  ensureWritableStorage();

  if (USE_BLOB_STORAGE) {
    return uploadBlobFiles(collection, files);
  }

  return uploadLocalFiles(collection, files);
}

async function deleteLocalRecord(collection: CollectionName, recordId: string) {
  const records = await listLocalRecords(collection);
  const record = records.find((item) => item.id === recordId);

  if (!record) {
    return null;
  }

  const remaining = records.filter((item) => item.id !== recordId);
  await saveLocalRecords(collection, remaining);

  const filePath = path.join(getCollectionConfig(collection).folder, record.storedName);
  try {
    await unlink(filePath);
  } catch {
    // Ignore missing files so metadata can still be cleaned up.
  }

  return record;
}

async function deleteBlobRecord(collection: CollectionName, recordId: string) {
  const { del } = await getBlobSdk();
  const records = await listRecords(collection);
  const record = records.find((item) => item.id === recordId);

  if (!record) {
    return null;
  }

  try {
    await del(record.storedName);
  } catch {
    if (record.url) {
      await del(record.url);
    } else {
      throw new Error("Unable to delete blob record");
    }
  }
  return record;
}

export async function deleteRecord(collection: CollectionName, recordId: string) {
  ensureWritableStorage();

  if (USE_BLOB_STORAGE) {
    return deleteBlobRecord(collection, recordId);
  }

  return deleteLocalRecord(collection, recordId);
}

export async function readStoredFile(collection: CollectionName, storedName: string) {
  if (USE_BLOB_STORAGE) {
    const { get } = await getBlobSdk();
    const result = await get(storedName, { access: "private" });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const record = blobRecordFromStoredName(collection, storedName, {
      type: result.blob.contentType || "application/octet-stream",
      size: result.blob.size || 0,
    });

    return {
      record,
      stream: result.stream,
      contentType: result.blob.contentType || record.type,
      size: result.blob.size || record.size,
    } satisfies StoredFilePayload;
  }

  const filePath = path.join(getCollectionConfig(collection).folder, storedName);
  const records = await listLocalRecords(collection);
  const record = records.find((item) => item.storedName === storedName);

  if (!record) {
    return null;
  }

  let resolvedPath = filePath;

  try {
    await access(resolvedPath);
  } catch {
    const legacyPath = path.join(UPLOADS_DIR, storedName);
    try {
      await access(legacyPath);
      resolvedPath = legacyPath;
    } catch {
      return null;
    }
  }

  const buffer = await readFile(resolvedPath);
  return { buffer, record } satisfies StoredFilePayload;
}
