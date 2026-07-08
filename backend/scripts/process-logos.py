"""Strip only connected black background from Al-Quds logo PNGs."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'al quds logos'
OUT_WEB = ROOT / 'web' / 'public'
OUT_ASSETS = ROOT / 'assets' / 'images'
THRESHOLD = 35


def is_bg(r: int, g: int, b: int, a: int) -> bool:
    return a > 0 and r <= THRESHOLD and g <= THRESHOLD and b <= THRESHOLD


def remove_connected_black_bg(src_path: Path, out_path: Path) -> tuple[int, int]:
    im = Image.open(src_path).convert('RGBA')
    w, h = im.size
    px = im.load()
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = px[x, y]
        if not is_bg(r, g, b, a):
            continue
        px[x, y] = (0, 0, 0, 0)
        q.append((x + 1, y))
        q.append((x - 1, y))
        q.append((x, y + 1))
        q.append((x, y - 1))

    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    im.save(out_path, 'PNG', optimize=True)
    return im.size


def make_app_icon(src_path: Path, out_path: Path, size: int = 1024) -> None:
    """Square Expo app icon from favicon, centered on brand background."""
    fav = Image.open(src_path).convert('RGBA')
    canvas = Image.new('RGBA', (size, size), (245, 243, 240, 255))
    target = int(size * 0.68)
    ratio = min(target / fav.width, target / fav.height)
    new_size = (max(1, int(fav.width * ratio)), max(1, int(fav.height * ratio)))
    fav = fav.resize(new_size, Image.Resampling.LANCZOS)
    x = (size - new_size[0]) // 2
    y = (size - new_size[1]) // 2
    canvas.paste(fav, (x, y), fav)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_path, 'PNG', optimize=True)
    print(f'OK {out_path.name} ({size}x{size})')


def main() -> None:
    jobs = [
        ('black logo.png', OUT_WEB / 'al-quds-logo-light.png'),
        ('white logo.png', OUT_WEB / 'al-quds-logo-dark.png'),
        ('favicon.png', OUT_WEB / 'al-quds-favicon.png'),
        ('favicon.png', OUT_WEB / 'al-quds-icon.png'),
        ('black logo.png', OUT_ASSETS / 'al-quds-logo-light.png'),
        ('white logo.png', OUT_ASSETS / 'al-quds-logo-dark.png'),
        ('favicon.png', OUT_ASSETS / 'al-quds-icon.png'),
        ('black logo.png', OUT_ASSETS / 'al-quds-mark.png'),
        ('black logo.png', OUT_ASSETS / 'al-quds-logo.png'),
        ('favicon.png', OUT_ASSETS / 'al-quds-favicon.png'),
    ]
    for src_name, dest in jobs:
        size = remove_connected_black_bg(SRC / src_name, dest)
        print(f'OK {dest.name} {size}')

    favicon_assets = OUT_ASSETS / 'al-quds-icon.png'
    make_app_icon(favicon_assets, OUT_ASSETS / 'al-quds-app-icon.png')
    make_app_icon(favicon_assets, OUT_WEB / 'al-quds-app-icon.png')


if __name__ == '__main__':
    main()
