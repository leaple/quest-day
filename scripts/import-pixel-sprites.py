#!/usr/bin/env python3
"""Safely import 24 x 3 x 6 transparent PNG character sprites. Stdlib only."""
from __future__ import annotations

import hashlib
import json
import struct
import zipfile
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    pack = root / "quest-day-all-24-sprites.zip"
    if not pack.is_file():
        raise SystemExit("Missing quest-day-all-24-sprites.zip in repository root")

    characters = json.loads((root / "characters-1.3.json").read_text(encoding="utf-8"))["characters"]
    ids = [character["id"] for character in characters]
    if len(ids) != 24 or len(set(ids)) != 24:
        raise SystemExit("Expected 24 distinct QUEST DAY character IDs")
    expected = {
        f"art/pixel/{cid}/stage{stage}/idle-{frame}.png"
        for cid in ids for stage in range(1, 4) for frame in range(6)
    }

    content = {}
    with zipfile.ZipFile(pack) as archive:
        names = archive.namelist()
        if len(set(names)) != len(names):
            raise SystemExit("Duplicate archive paths")
        actual = {name for name in names if name.lower().endswith(".png")}
        if actual != expected:
            raise SystemExit(
                "Sprite paths mismatch. Missing: " + ", ".join(sorted(expected - actual)[:8])
                + " Unexpected: " + ", ".join(sorted(actual - expected)[:8])
            )
        if archive.testzip() is not None:
            raise SystemExit("ZIP CRC verification failed")
        for path in sorted(expected):
            if archive.getinfo(path).file_size > 1_500_000:
                raise SystemExit("Sprite file too large: " + path)
            data = archive.read(path)
            if not data.startswith(b"\x89PNG\r\n\x1a\n") or data[12:16] != b"IHDR":
                raise SystemExit("Invalid PNG: " + path)
            width, height = struct.unpack(">II", data[16:24])
            color_type = data[25]
            if (width, height) != (512, 512) or color_type not in (3, 6):
                raise SystemExit("Unexpected dimensions/color format: " + path)
            if color_type == 3 and b"tRNS" not in data:
                raise SystemExit("Indexed PNG is not transparent: " + path)
            content[path] = data

    # Atomic validation: none of the output files are written until all pass.
    for path, data in content.items():
        destination = root / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)

    digest = hashlib.sha256(pack.read_bytes()).hexdigest()
    manifest = {
        "version": 1,
        "sha256": digest,
        "characterIds": ids,
        "framesPerStage": 6,
        "stagesPerCharacter": 3,
        "totalFrames": len(content),
    }
    (root / "art/pixel/manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Imported {len(content)} frames for {len(ids)} characters. SHA256 {digest[:12]}")


if __name__ == "__main__":
    main()
