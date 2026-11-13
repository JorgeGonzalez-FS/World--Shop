"""Descarga una foto candidata por producto buscando por nombre en internet.
Ejecutar en TU computadora (con internet), desde la carpeta world-shop:
    pip install ddgs pillow requests
    python scripts/buscar_fotos.py            # todos
    python scripts/buscar_fotos.py TLF011 LNB043   # solo esos códigos
Guarda assets/products/<codigo>.jpg, actualiza js/images.js y crea scripts/fotos_revision.csv.
IMPORTANTE: revisa cada foto (modelo correcto, sin marca de agua) y confirma que puedes usarla:
las imágenes de internet tienen derechos de autor. Si una foto está mal, bórrala y quita su línea de images.js.
"""
import json, re, sys, io, time, csv, pathlib, requests
from ddgs import DDGS
from PIL import Image
raiz = pathlib.Path(__file__).resolve().parent.parent
txt = (raiz/'js/products.js').read_text(encoding='utf-8')
prods = json.loads(txt[txt.index('['):txt.rindex(']')+1])
filtro = set(sys.argv[1:])
out = raiz/'assets/products'; out.mkdir(parents=True, exist_ok=True)
imgjs = raiz/'js/images.js'
m = re.search(r'window\.IMAGENES=(\{.*\});', imgjs.read_text(encoding='utf-8'), re.S)
mapa = json.loads(m.group(1)) if m else {}
filas = []
def consulta(p):
    n = re.sub(r'\b\d+\s*GB\s*\+\s*\d+\s*RAM\b|\bESIM\b|GRADO A|\bNUEVO\b', '', p['nombre'], flags=re.I)
    return f"{p['marca']} {n} producto fondo blanco"
with DDGS() as d:
    for p in prods:
        if filtro and p['codigo'] not in filtro: continue
        if p['codigo'] in mapa and (raiz/mapa[p['codigo']]).exists(): continue
        ok = None
        try:
            for r in d.images(consulta(p), max_results=6):
                try:
                    b = requests.get(r['image'], timeout=12, headers={'User-Agent':'Mozilla/5.0'}).content
                    im = Image.open(io.BytesIO(b)).convert('RGB')
                    if min(im.size) < 300: continue
                    im.thumbnail((700, 700)); f = out/f"{p['codigo']}.jpg"
                    im.save(f, 'JPEG', quality=82, optimize=True)
                    ok = (f"assets/products/{p['codigo']}.jpg", r['image'], r.get('title','')); break
                except Exception: continue
        except Exception as e:
            print('error búsqueda', p['codigo'], e); time.sleep(5)
        if ok:
            mapa[p['codigo']] = ok[0]; filas.append([p['codigo'], p['nombre'], ok[1], ok[2]])
            print('OK', p['codigo'], p['nombre'])
        else: print('sin foto', p['codigo'], p['nombre'])
        time.sleep(1.2)
imgjs.write_text('window.IMAGENES='+json.dumps(mapa, ensure_ascii=False, indent=1)+';\n', encoding='utf-8')
with open(raiz/'scripts/fotos_revision.csv', 'a', newline='', encoding='utf-8') as f:
    csv.writer(f).writerows(filas)
