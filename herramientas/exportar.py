from pathlib import Path
import argparse,json,hashlib,shutil,subprocess
R=Path(__file__).resolve().parents[1]
def digest(p):
 with p.open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
def export(destination,check=False):
 canon=json.loads((R/'catalogo/canon.cartas.json').read_text('utf-8'));dest=Path(destination).resolve()
 if dest==R or R in dest.parents and 'exportaciones'not in dest.relative_to(R).parts:raise ValueError('Usar carpeta externa o exportaciones/; no sobrescribir repositorio.')
 expected=canon['base']['paquete']
 if check:
  lock=json.loads((dest/'arte.lock.json').read_text('utf-8'))
  if lock['canon_sha256']!=digest(R/'catalogo/canon.cartas.json'):raise ValueError('Exportación usa otro canon.')
  missing=[p for p,h in lock['archivos'].items()if not(dest/p).is_file()or digest(dest/p)!=h]
  extras={p.relative_to(dest).as_posix()for p in dest.rglob('*')if p.is_file()}-set(lock['archivos'])-{'arte.lock.json'}
  if missing or extras:raise ValueError(f'Archivos diferentes: {missing}; adicionales: {sorted(extras)}')
  print('OK: exportación coincide con lock y canon aprobado.');return
 if dest.exists()and any(dest.iterdir()):raise ValueError('Destino debe estar vacío para evitar mezclar versiones.')
 for name,e in expected.items():
  source=R/e['objeto'];target=(dest/name).resolve()
  if dest not in target.parents:raise ValueError('Ruta de exportación inválida.')
  if digest(source)!=e['sha256']:raise ValueError('Hash inválido '+name)
  target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
 # The resource-only export deliberately has no dependency on old game code or local rule files.
 manifest=dest/'manifest.json';m=json.loads(manifest.read_text('utf-8'));m.pop('integrationModule',None);m.pop('styleGuide',None);m['rules']={'status':'external-reference; no rule engine bundled'};m['artSource']={'version':canon['version'],'canon':'catalogo/canon.cartas.json'};manifest.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n','utf-8')
 head=subprocess.check_output(['git','-C',str(R),'rev-parse','HEAD'],text=True).strip()
 lock={'schema_version':1,'repositorio':'https://github.com/Jonathan-Bello/Noched-de-animas-arte','commit':head,'version':canon['version'],'canon_sha256':digest(R/'catalogo/canon.cartas.json'),'archivos':{p.relative_to(dest).as_posix():digest(p)for p in sorted(dest.rglob('*'))if p.is_file()}}
 (dest/'arte.lock.json').write_text(json.dumps(lock,ensure_ascii=False,indent=2)+'\n','utf-8');print(f'Exportados {len(lock["archivos"])} recursos aprobados en {dest}')
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--destino',required=True);a.add_argument('--comprobar',action='store_true');p=a.parse_args();export(p.destino,p.comprobar)
