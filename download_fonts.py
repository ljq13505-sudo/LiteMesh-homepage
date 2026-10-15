"""Download real Inter weights for the local academic page."""
from pathlib import Path
from urllib.request import Request, urlopen
import re

root = Path(__file__).parent / 'fonts'
root.mkdir(exist_ok=True)
url = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
css = urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30).read().decode()
remotes = list(dict.fromkeys(re.findall(r'url\((https://[^)]+)\)', css)))
if not remotes:
    raise RuntimeError('The font service did not return font files.')
for i, remote in enumerate(remotes):
    suffix = remote.split('?')[0].rsplit('.', 1)[-1]
    name = f'inter-{i}.{suffix}'
    (root / name).write_bytes(urlopen(remote, timeout=30).read())
    css = css.replace(remote, name)
(root / 'fonts.css').write_text(css, encoding='utf-8')
print(f'Saved {len(remotes)} Inter font files.')
