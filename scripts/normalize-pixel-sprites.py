#!/usr/bin/env python3
"""Normalize all character sprites to Moon Knight's proportions and still baseline.

Reads the existing 24 x 3 x 6 transparent PNGs and rewrites 414 (all except
the already-approved Moon Knight). Idempotent via manifest.layoutVersion.
Requires Pillow, NumPy and opencv-python-headless.
"""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "art/pixel"
CATALOG = ROOT / "characters-1.3.json"
MANIFEST = ART / "manifest.json"
STAGES = (1, 2, 3)
FRAMES = tuple(range(6))
REFERENCE_ID = "knight"
TARGET_HEIGHT = {1: 260, 2: 273, 3: 290}
TARGET_BASELINE = {1: 383, 2: 389, 3: 397}


def main_component(image: Image.Image):
    pixels = np.asarray(image.convert("RGBA"))
    alpha = (pixels[:, :, 3] > 70).astype(np.uint8)
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(alpha, 8)
    if count < 2:
        raise ValueError("No visible sprite")
    index = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x, y, w, h, size = map(int, stats[index])
    if h < 64 or size < 500:
        raise ValueError("Sprite body missing or too small")
    y0 = min(511, y + round(h * 0.10))
    y1 = min(512, y + max(1, round(h * 0.45)))
    upper = (labels[y0:y1, :] == index).sum(axis=0)
    head_x = float(np.average(np.arange(512), weights=upper)) if upper.sum() else float(centroids[index, 0])
    return {"box": (x, y, w, h), "headX": head_x, "bottom": y + h - 1}


def intensity(image: Image.Image):
    pixels = np.asarray(image.convert("RGBA"))
    gray = cv2.cvtColor(pixels[:, :, :3], cv2.COLOR_RGB2GRAY).astype(np.float32)
    weighted = gray * (pixels[:, :, 3].astype(np.float32) / 255.0)
    return cv2.resize(weighted, (256, 256), interpolation=cv2.INTER_AREA)


def align_to_first(reference, current):
    (x, y), response = cv2.phaseCorrelate(reference, current)
    if not np.isfinite(x) or not np.isfinite(y) or response < 0.28:
        return (0, 0)
    return (-max(-60, min(60, int(round(x * 2)))),
            -max(-32, min(32, int(round(y * 2)))))


def composite_transform(image, scale, move_x, move_y):
    width = max(1, round(512 * scale))
    height = max(1, round(512 * scale))
    source = image.convert("RGBA")
    if scale != 1.0:
        source = source.resize((width, height), Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    ox = round((512 - width) / 2 + move_x)
    oy = round((512 - height) / 2 + move_y)
    output.paste(source, (ox, oy))
    return output


def frame_path(identifier, stage, frame):
    return ART / identifier / f"stage{stage}" / f"idle-{frame}.png"


def apply_normalization(identifier, stage):
    images = [Image.open(frame_path(identifier, stage, f)).convert("RGBA") for f in FRAMES]
    measures = [main_component(img) for img in images]
    body_height = float(np.median([m["box"][3] for m in measures]))
    scale = float(np.clip(TARGET_HEIGHT[stage] / body_height, 0.56, 1.19))
    baseline = float(measures[0]["bottom"])
    head_x = float(measures[0]["headX"])
    ref = intensity(images[0])
    shifts = [(0, 0)] + [align_to_first(ref, intensity(img)) for img in images[1:]]

    def build(scale_now):
        dx = -scale_now * (head_x - 256.0)
        dy = TARGET_BASELINE[stage] - (256.0 + scale_now * (baseline - 256.0))
        return [composite_transform(img, scale_now,
                    dx + sx * scale_now, dy + sy * scale_now)
                for img, (sx, sy) in zip(images, shifts)]

    outputs = build(scale)
    for _ in range(7):
        boxes = [frame.getchannel("A").getbbox() for frame in outputs]
        if all(box is not None and min(box[0], box[1], 512-box[2], 512-box[3]) >= 15 for box in boxes):
            break
        scale *= 0.95
        outputs = build(scale)
    else:
        raise ValueError(f"Could not keep {identifier} stage{stage} within safe margins")

    for frame, output in enumerate(outputs):
        output.save(frame_path(identifier, stage, frame), optimize=False, compress_level=1)
    return {"stage": stage, "scale": round(scale, 3),
            "minMargin": min(min(box[0], box[1], 512-box[2], 512-box[3]) for box in boxes),
            "shifts": shifts}


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf8"))
    if manifest.get("layoutVersion") == 2:
        print("Sprite normalization already at version 2; skipping double scaling.")
        return
    characters = json.loads(CATALOG.read_text(encoding="utf8"))["characters"]
    ids = [c["id"] for c in characters]
    if len(ids) != 24 or len(set(ids)) != 24 or REFERENCE_ID not in ids:
        raise SystemExit("Expected exactly 24 characters including knight")
    for identifier in ids:
        for stage in STAGES:
            for frame in FRAMES:
                path = frame_path(identifier, stage, frame)
                if not path.is_file():
                    raise SystemExit(f"Missing sprite: {path}")
                with Image.open(path) as img:
                    if img.size != (512, 512):
                        raise SystemExit(f"Unexpected sprite dimensions: {path} => {img.size}")

    for identifier in ids:
        if identifier == REFERENCE_ID:
            continue
        reports = [apply_normalization(identifier, stage) for stage in STAGES]
        print(identifier, [f"{r['scale']:.2f}x" for r in reports], flush=True)

    manifest["layoutVersion"] = 2
    manifest["normalizedTo"] = "knight"
    manifest["normalizationRules"] = (
        "fixed 512px canvas; same scale per stage; head centered; "
        "feet anchored; phase-aligned 6 frame idle"
    )
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print("Normalized 414 frames; 18 approved knight frames unchanged.")


if __name__ == "__main__":
    main()
