#!/usr/bin/python3
import json, os, sys, urllib.request
from hermes_cli.auth import resolve_minimax_oauth_runtime_credentials
LABELS={"project_objective":"objetivo verificable de un proyecto","campaign_objective":"objetivo estratégico de una campaña de marketing","admin_notes":"notas claras de un registro administrativo"}
def fail(): print("MiniMax OAuth unavailable",file=sys.stderr); raise SystemExit(1)
try:
 data=json.load(sys.stdin); creds=resolve_minimax_oauth_runtime_credentials(as_token_provider=True); provider=creds.get("api_key"); token=str(provider() if callable(provider) else "").strip(); base=str(creds["base_url"]).rstrip("/")
 if not token or base != "https://api.minimax.io/anthropic": fail()
 user="\n".join(filter(None,[f"Tipo: {LABELS[data['context']]}",f"Título: {data.get('title')}" if data.get('title') else "",f"Categoría: {data.get('category')}" if data.get('category') else "",f"Borrador: {data['draft']}"]))
 payload={"model":os.environ.get("NUGA_MINIMAX_MODEL","MiniMax-M3"),"system":"Eres un editor profesional en español para NUGA Team Console. Mejora claridad, estructura, precisión y verificabilidad. Conserva estrictamente los hechos proporcionados. No inventes nombres, cifras, fechas, presupuestos, clientes, métricas ni resultados. Devuelve únicamente el texto mejorado, sin explicación, encabezados ni comillas.","messages":[{"role":"user","content":user}],"temperature":0.3,"max_tokens":350}
 req=urllib.request.Request(base+"/v1/messages",data=json.dumps(payload).encode(),method="POST",headers={"Authorization":"Bearer "+token,"x-api-key":token,"anthropic-version":"2023-06-01","Content-Type":"application/json"})
 with urllib.request.urlopen(req,timeout=30) as response: result=json.load(response)
 text="".join(block.get("text","") for block in result.get("content",[]) if block.get("type")=="text")
 if not text.strip(): fail()
 json.dump({"suggestion":text},sys.stdout)
except Exception: fail()
