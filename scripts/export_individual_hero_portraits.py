#!/usr/bin/env python3
"""Export 36 *independent* WebP portraits (12 heroes × 3 stages).

Source: four already-versioned 3x3 1080×1350 WebP atlas files.
Output: one 360×450 image per character/stage, without other atlas cells.
This does not touch save data, quests, prices, or unlock conditions.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import json

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "art" / "painted"
DEST = SOURCE / "individual"
GROUPS = (
    ("heroes-1.webp", ("hero_aren", "hero_lyra", "hero_kyle")),
    ("heroes-2.webp", ("hero_sera", "hero_zed", "hero_elin")),
    ("heroes-3.webp", ("hero_rohan", "hero_eve", "hero_baruk")),
    ("heroes-4.webp", ("hero_nia", "hero_sion", "hero_lumi")),
)
CELL_W, CELL_H = 360, 450

def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    artifacts = []
    for group_name, names in GROUPS:
        with Image.open(SOURCE / group_name) as source:
            atlas = source.convert("RGBA")
        if atlas.size != (CELL_W * 3, CELL_H * 3):
            raise RuntimeError(f"Unexpected atlas dimensions for {group_name}: {atlas.size}")
        for row, hero_id in enumerate(names):
            for stage in (1, 2, 3):
                col = stage - 1
                x, y = col * CELL_W, row * CELL_H
                tile = atlas.crop((x, y, x + CELL_W, y + CELL_H))
                # Feather a few pixels of *outer tile edges* to hide
                # remnants of source board borders without cutting characters.
                base_alpha = tile.getchannel("A")
                edge = Image.new("L", tile.size, 255)
                pen = ImageDraw.Draw(edge)
                for inset in range(7):
                    strength = round(255 * (inset + 1) / 8)
                    pen.rectangle((inset, inset, CELL_W-1-inset,
                                   CELL_H-1-inset), outline=strength)
                from PIL import ImageChops
                tile.putalpha(ImageChops.multiply(base_alpha, edge))
                target = DEST / f"{hero_id}-stage{stage}.webp"
                tile.save(target, "WEBP", quality=87, method=6)
                artifacts.append({
                    "id": hero_id,
                    "stage": stage,
                    "file": target.name,
                    "size_bytes": target.stat().st_size,
                    "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
                })
    if len(artifacts) != 36 or len({x["file"] for x in artifacts}) != 36:
        raise RuntimeError("Incomplete or duplicate hero asset export")
    (DEST / "manifest.json").write_text(
        json.dumps({"width": CELL_W, "height": CELL_H, "artworks": artifacts},
                   ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    print(f"Generated {len(artifacts)} distinct images at {DEST}")

if __name__ == "__main__":
    main()
