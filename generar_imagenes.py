"""Genera js/images.js leyendo las fotos de assets/products/ (cualquier subcarpeta).
El nombre de cada foto debe ser el código del producto, ej.: TLF011.jpg, LNB043.webp, apple/TLF011.png
Uso (desde la carpeta world-shop):  python scripts/generar_imagenes.py
"""
import json, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
txt = (raiz/'js/products.js').read_text(encoding='utf-8')
codigos = {p['codigo'].upper(): p['codigo'] for p in json.loads(txt[txt.index('['):txt.rindex(']')+1])}
mapa, huerfanas = {}, []
for f in sorted((raiz/'assets/products').rglob('*')):
    if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp', '.avif') and f.is_file():
        c = codigos.get(f.stem.upper())
        if c: mapa[c] = f.relative_to(raiz).as_posix()
        else: huerfanas.append(f.name)
(raiz/'js/images.js').write_text('window.IMAGENES='+json.dumps(mapa, ensure_ascii=False, indent=1)+';\n', encoding='utf-8')
print(f'{len(mapa)} fotos registradas.' + (f' Sin coincidencia de código: {huerfanas}' if huerfanas else ''))
