#!/usr/bin/env bash
# =============================================================================
# deploy-functions.sh
# Deploya as Edge Functions deste repo num Supabase SELF-HOSTED (ex.: via Coolify).
#
# No self-hosted não existe `supabase functions deploy` para a nuvem: "deployar"
# = copiar a pasta de cada função para o volume `volumes/functions/` da VM e
# reiniciar o container edge-runtime. Este script automatiza isso.
#
# Uso (na VM):
#   curl -O https://raw.githubusercontent.com/rutradb/ad-whisperer-84/main/deploy-functions.sh
#   EDGE_CONTAINER=supabase-edge-functions-qob8pfgine3ic2pzctbifl6k bash deploy-functions.sh
#
# Pré-requisitos: docker rodando o stack do Supabase, git e curl instalados.
# =============================================================================
set -euo pipefail

REPO_URL="https://github.com/rutradb/ad-whisperer-84.git"
REPO_BRANCH="${REPO_BRANCH:-main}"
CONTAINER="${EDGE_CONTAINER:-supabase-edge-functions}"
TMP_DIR="$(mktemp -d)"

# Funções a deployar. Sobrescreva com:  FUNCS="agent-run strategic-scan" bash deploy-functions.sh
FUNCS="${FUNCS:-agent-run strategic-scan evaluate-rules google-ads-auth google-ads-proxy shopify-proxy}"

echo "==> 1/5 Localizando o volume de functions do container '$CONTAINER'..."
if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "ERRO: container '$CONTAINER' não encontrado. Containers com 'edge'/'function':"
  docker ps --format '{{.Names}}' | grep -iE 'edge|function' || true
  echo "Defina o nome certo:  EDGE_CONTAINER=<nome> bash deploy-functions.sh"
  exit 1
fi

VOL_FUNCS="$(docker inspect "$CONTAINER" \
  --format '{{range .Mounts}}{{if eq .Destination "/home/deno/functions"}}{{.Source}}{{end}}{{end}}')"

if [ -z "$VOL_FUNCS" ] || [ ! -d "$VOL_FUNCS" ]; then
  echo "ERRO: não achei o volume mapeado para /home/deno/functions."
  echo "Mounts do container:"
  docker inspect "$CONTAINER" --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
  exit 1
fi
echo "    Volume: $VOL_FUNCS"

echo "==> 2/5 Clonando o repositório (branch $REPO_BRANCH)..."
git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$TMP_DIR/repo"
SRC="$TMP_DIR/repo/supabase/functions"

echo "==> 3/5 Copiando funções para o volume (a pasta 'main'/roteador é preservada)..."
for fn in $FUNCS; do
  if [ -d "$SRC/$fn" ]; then
    rm -rf "${VOL_FUNCS:?}/$fn"
    cp -r "$SRC/$fn" "$VOL_FUNCS/$fn"
    echo "    + $fn"
  else
    echo "    ! pulando '$fn' (não existe em $SRC)"
  fi
done

echo "==> 4/5 Reiniciando o edge-runtime..."
docker restart "$CONTAINER" >/dev/null
sleep 4

echo "==> 5/5 Limpando temporários..."
rm -rf "$TMP_DIR"

echo
echo "✅ Concluído. Funções no volume:"
ls -1 "$VOL_FUNCS"
echo
echo "Valide (deve responder 400 'Payload inválido', não 500):"
echo "  curl -s -X POST -H 'apikey: <ANON_KEY>' -H 'Authorization: Bearer <ANON_KEY>' \\"
echo "    -H 'Content-Type: application/json' -d '{}' \\"
echo "    https://supabase.paineldev.org/functions/v1/agent-run"
