from pathlib import Path
import json,hashlib,sys
R=Path(__file__).resolve().parents[1]
def digest(p):
 with p.open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
def verify():
 data=json.loads((R/'catalogo/inventario.json').read_text('utf-8'));errors=[];done=set()
 for entry in data['archivos']:
  path=(R/entry['objeto']).resolve()
  if R not in path.parents:errors.append('Ruta fuera del repositorio');continue
  if path in done:continue
  done.add(path)
  if not path.is_file()or path.stat().st_size!=entry['bytes']or digest(path)!=entry['sha256']:errors.append(entry['objeto'])
 approvals={a['id']:a for a in json.loads((R/'catalogo/aprobaciones.json').read_text('utf-8'))['registros']}
 canon=json.loads((R/'catalogo/canon.cartas.json').read_text('utf-8'))
 for kind in ['cartas','reversos']:
  ids=[e['id']for e in canon['base'][kind]]
  if len(ids)!=len(set(ids)):errors.append('IDs repetidos '+kind)
  for e in canon['base'][kind]:
   if approvals[e['aprobacion']]['estado']!='aprobado':errors.append('No aprobado '+e['id'])
   for f in e['formatos'].values():
    if digest(R/f['objeto'])!=f['sha256']:errors.append('Hash canon '+e['id'])
 backs={e['id']for e in canon['base']['reversos']}
 for c in canon['base']['cartas']:
  if c['reverso_id']not in backs:errors.append('Reverso faltante '+c['id'])
 if errors:raise RuntimeError('\n'.join(errors))
 print(f"OK: {len(data['archivos'])} fuentes, {len(done)} objetos íntegros, {len(canon['base']['cartas'])} cartas y {len(backs)} reversos aprobados.")
 return True
if __name__=='__main__':verify()
