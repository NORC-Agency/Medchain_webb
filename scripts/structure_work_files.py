#!/usr/bin/env python3
"""Create a practical overview of the workspace file structure."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "WORKSPACE_STRUCTURE.md"
IGNORED_DIRS = {".git", "node_modules", ".DS_Store", "__pycache__"}


@dataclass(frozen=True)
class FileInfo:
    path: Path
    size: int

    @property
    def rel(self) -> str:
        return self.path.relative_to(ROOT).as_posix()

    @property
    def suffix(self) -> str:
        return self.path.suffix.lower()


CATEGORIES = {
    "Webbimplementation": {".html", ".css", ".js", ".ts", ".tsx", ".jsx"},
    "Bilder och visuella assets": {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"},
    "Dokument och underlag": {".md", ".pdf", ".docx", ".pptx", ".xlsx", ".csv"},
    "Script och automation": {".py", ".sh", ".mjs", ".cjs"},
}


def iter_files() -> list[FileInfo]:
    files: list[FileInfo] = []
    for path in ROOT.rglob("*"):
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        if path.is_file() and path != OUTPUT:
            files.append(FileInfo(path=path, size=path.stat().st_size))
    return sorted(files, key=lambda item: item.rel)


def category_for(file_info: FileInfo) -> str:
    for category, suffixes in CATEGORIES.items():
        if file_info.suffix in suffixes:
            return category
    return "Oklassificerat"


def format_size(size: int) -> str:
    if size < 1024:
        return f"{size} B"
    if size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    return f"{size / (1024 * 1024):.1f} MB"


def build_markdown(files: list[FileInfo]) -> str:
    grouped: dict[str, list[FileInfo]] = {}
    for file_info in files:
        grouped.setdefault(category_for(file_info), []).append(file_info)

    lines = [
        "# Arbetsytans filstruktur",
        "",
        f"Genererad: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        "Den här filen är en snabb översikt för att se vad som finns i projektet och vad som kan behöva struktureras.",
        "",
        "## Sammanfattning",
        "",
        f"- Totalt antal filer: {len(files)}",
    ]

    for category in sorted(grouped):
        lines.append(f"- {category}: {len(grouped[category])}")

    lines.extend(["", "## Filer per kategori", ""])

    for category in sorted(grouped):
        lines.extend([f"### {category}", ""])
        for file_info in grouped[category]:
            lines.append(f"- `{file_info.rel}` ({format_size(file_info.size)})")
        lines.append("")

    suggestions = build_suggestions(files)
    lines.extend(["## Förslag", ""])
    if suggestions:
        lines.extend(f"- {suggestion}" for suggestion in suggestions)
    else:
        lines.append("- Inga akuta strukturproblem hittades.")
    lines.append("")

    return "\n".join(lines)


def build_suggestions(files: list[FileInfo]) -> list[str]:
    suggestions: list[str] = []
    root_files = [file_info for file_info in files if len(file_info.path.relative_to(ROOT).parts) == 1]
    docs_at_root = [
        file_info
        for file_info in root_files
        if file_info.suffix in {".pdf", ".docx", ".pptx", ".xlsx", ".csv"}
    ]

    if docs_at_root:
        suggestions.append("Överväg att flytta arbetsdokument från rotmappen till `docs/` eller `assets/`.")
    if not (ROOT / "docs").exists():
        suggestions.append("Skapa `docs/` när projektet får fler anteckningar, beslut eller arbetsunderlag.")
    if not any(file_info.rel == "README.md" for file_info in files):
        suggestions.append("Lägg till en `README.md` med kort arbetsrutin och projektbeskrivning.")
    if any(file_info.rel.startswith("assets/") for file_info in files):
        suggestions.append("Ge assets beskrivande namn så att de är begripliga utan att öppnas.")

    return suggestions


def main() -> None:
    files = iter_files()
    OUTPUT.write_text(build_markdown(files), encoding="utf-8")
    print(f"Skrev {OUTPUT.relative_to(ROOT)} med {len(files)} filer.")


if __name__ == "__main__":
    main()
