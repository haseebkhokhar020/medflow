#!/usr/bin/env python3
"""Rebuild the bundled *international* medicine dictionary from NLM RxTerms.
Only the non-proprietary, current SCD/SBD records are included. No prices,
barcodes, prescribing status, or country registration claims are imported.
Usage: python3 scripts/build-medicine-catalog.py [path-to-RxTerms202609.zip]
"""
import csv,gzip,hashlib,io,json,sys,urllib.request,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
URL='https://data.lhncbc.nlm.nih.gov/public/rxterms/release/RxTerms202609.zip'
SHA256='c7aefff1974144b7a43f38f43d7a034b5b39d1339e53635ff90a94ea555965f2'
file=Path(sys.argv[1]) if len(sys.argv)>1 else None
raw=file.read_bytes() if file else urllib.request.urlopen(URL,timeout=60).read()
assert hashlib.sha256(raw).hexdigest()==SHA256,'Unexpected upstream archive hash; review the source before updating.'
z=zipfile.ZipFile(io.BytesIO(raw))
def rows(name):
    with z.open(name) as stream:
        yield from csv.DictReader(io.TextIOWrapper(stream,encoding='utf-8-sig',newline=''),delimiter='|')
ingredients={}
for r in rows('RxTermsIngredients202609.txt'):
    ingredients.setdefault(r['RXCUI'],set()).add(r['INGREDIENT'].strip())
output=[];dedup=set()
for r in rows('RxTerms202609.txt'):
    if r['TTY'] not in ('SCD','SBD') or r['SUPPRESS_FOR'].strip() or r['IS_RETIRED'].strip():continue
    cui=r['RXCUI'];display=r['DISPLAY_NAME'].split(' (')[0].strip();form=r['RXN_DOSE_FORM'].strip()
    strength=r['STRENGTH'].strip();brand=r['BRAND_NAME'].strip().title() if r['TTY']=='SBD' else ''
    generic=' / '.join(sorted(ingredients.get(cui,[]),key=str.casefold))
    if not display or not form or not strength:continue
    name=f'{brand or display} {strength} {form}'.strip()
    # Each RXCUI is the canonical source key; records with identical display are collapsed.
    key=(name.casefold(),generic.casefold());
    if key in dedup:continue
    dedup.add(key)
    aliases=r['DISPLAY_NAME_SYNONYM'].strip()
    if 'acetaminophen' in generic.casefold() or 'acetaminophen' in display.casefold():aliases=(aliases+' paracetamol').strip()
    if 'albuterol' in generic.casefold() or 'albuterol' in display.casefold():aliases=(aliases+' salbutamol').strip()
    output.append({'id':f'rx:{cui}','name':name[:180],'brand':brand,'generic':generic[:160],
        'form':form[:80],'strength':strength[:70],'unit':('bottle' if any(x in form.lower() for x in ['solution','suspension','syrup','liquid','drops']) else 'tablet' if 'tablet' in form.lower() else 'capsule' if 'capsule' in form.lower() else 'unit'),
        'aliases':aliases[:100]})
assert len(output)>10000,f'Insufficient data: {len(output)} entries'
output.sort(key=lambda x:(x['name'].casefold(),x['id']))
target=ROOT/'assets/medicine/rxterms-202609.json.gz'
# Fixed gzip mtime keeps asset reproducible.
with target.open('wb') as f:
    with gzip.GzipFile(filename='',mode='wb',fileobj=f,mtime=0,compresslevel=9) as gz:
        gz.write(json.dumps(output,ensure_ascii=False,separators=(',',':')).encode('utf8'))
print(f'{len(output)} current SCD/SBD terms -> {target} ({target.stat().st_size:,} bytes)')
