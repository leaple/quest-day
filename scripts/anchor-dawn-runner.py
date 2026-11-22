#!/usr/bin/env python3
"""Anchor all six Dawn Runner idle frames without changing other characters.

The source atlas placed the hero at different X coordinates in successive
frames. Earlier bulk phase-registration capped shifts at 60 px; this fixes
the actual foreground body anchor independently for every frame.

Only translates existing RGBA pixels: no resampling, body repainting,
squashing, or changes to the approved Moon Knight.
"""
from __future__ import annotations

import json
from pathlib import Path
import numpy as np
import cv2
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "art" / "pixel"
ID = "dawn_runner"
MANIFEST = ART / "manifest.json"
TARGET_HEAD_X = 256.0
TARGET_FEET = {1: 383, 2: 389, 3: 397}
SAFE_BODY_MARGIN = 12
VERSION = 3


def body_anchor(pixels: np.ndarray):
    alpha = (pixels[:, :, 3] > 70).astype("uint8")
    count, labels, stats, _ = cv2.connectedComponentsWithStats(alpha, 8)
    if count < 2:
        raise ValueError("No foreground connected components")
    main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x, y, w, h, area = (int(v) for v in stats[main])
    if area < 500 or h < 50:
        raise ValueError("Unexpectedly small foreground body")
    # Head, unlike the cape and glow particles, is a stable horizontal anchor.
    upper = (labels[y + round(h * .10):y + round(h * .44), :] == main)
    column_weights = upper.sum(axis=0)
    if not column_weights.any():
        raise ValueError("Could not identify head")
    head_x = float(np.average(np.arange(pixels.shape[1]), weights=column_weights))
    return head_x, y + h - 1, (x, y, w, h), main, labels, stats


def discard_far_atlas_fragments(image: np.ndarray):
    """Remove detached bits from adjacent sheet panels, not character effects."""
    head_x, feet, (x, y, w, h), main, labels, stats = body_anchor(image)
    result = image.copy()
    for label in range(1, len(stats)):
        if label == main:
            continue
        sx, sy, sw, sh, area = (int(v) for v in stats[label])
        # Only remove small components separated horizontally from the body.
        # Nearby aura, clothing trims, and effects remain untouched.
        distant = sx > x + w + 52 or sx + sw < x - 52
        if distant and area < 750:
            result[labels == label] = 0
    return result


def translate(image: np.ndarray, dx: int, dy: int):
    h, w = image.shape[:2]
    matrix = np.float32([[1, 0, dx], [0, 1, dy]])
    return cv2.warpAffine(image, matrix, (w, h), flags=cv2.INTER_NEAREST,
                          borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("dawnRunnerAnchorVersion", 0) >= VERSION:
        print("Dawn Runner anchor adjustment already applied; skipping.")
        return

    outputs = []
    for stage in (1, 2, 3):
        for frame in range(6):
            path = ART / ID / f"stage{stage}" / f"idle-{frame}.png"
            if not path.is_file():
                raise SystemExit(f"Missing sprite: {path}")
            image = np.asarray(Image.open(path).convert("RGBA"))
            if image.shape != (512, 512, 4):
                raise SystemExit(f"Invalid sprite dimensions: {path}")
            image = discard_far_atlas_fragments(image)
            head_x, feet, bbox, *_ = body_anchor(image)
            dx = round(TARGET_HEAD_X - head_x)
            dy = round(TARGET_FEET[stage] - feet)
            result = translate(image, dx, dy)
            new_head, new_feet, (x,y,w,h), *_ = body_anchor(result)
            if abs(new_head - TARGET_HEAD_X) > 1.5 or abs(new_feet - TARGET_FEET[stage]) > 1:
                raise SystemExit(f"Anchor validation failed: {path}")
            if min(x, y, 512-(x+w), 512-(y+h)) < SAFE_BODY_MARGIN:
                raise SystemExit(f"Body touches output bounds: {path}")
            outputs.append((path, result, stage, frame, dx, dy))
            print(f"{ID} stage{stage}/idle-{frame}: shift ({dx:+},{dy:+}) "
                  f"head={new_head:.1f} feet={new_feet}", flush=True)

    # Do not mutate repository assets until every frame passes validation.
    for path, arr, *_ in outputs:
        Image.fromarray(arr, "RGBA").save(path, optimize=True)
    manifest["dawnRunnerAnchorVersion"] = VERSION
    manifest["dawnRunnerAnchor"] = "head x=256, stage baselines=383/389/397, fixed body; all 18 frames"
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Dawn Runner aligned; approved knight and other 22 characters untouched.")


if __name__ == "__main__":
    main()
