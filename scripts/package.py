from pathlib import Path
import hashlib
import zipfile

root = Path(__file__).resolve().parent.parent
out = root / 'artifacts'
out.mkdir(exist_ok=True)
names = ['krisenradar-card.js', 'hacs.json', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'preview.html']
names += [p.relative_to(root).as_posix() for p in sorted((root / 'examples').glob('*.yaml'))]
archive = out / 'ha-worldmeter-1.0.0.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for name in names:
        z.write(root / name, name)
checks = []
for p in [root / 'krisenradar-card.js', archive]:
    checks.append(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}')
(out / 'SHA256SUMS.txt').write_text('\n'.join(checks) + '\n')
print(f'Created {archive.name}: {archive.stat().st_size} bytes')
