#!/usr/bin/env bash
set -euo pipefail
if [[ ! -f "./odoo-bin" ]]; then
  echo "Erro: codigo-base ainda nao importado." >&2
  exit 1
fi
database="$(printenv ZORD_DB || echo zord)"
if [[ ! "$database" =~ ^[a-zA-Z_][a-zA-Z0-9_-]*$ ]]; then
  echo "Erro: nome de banco invalido." >&2
  exit 2
fi
echo "Inicializando banco '$database' em pt_BR e BRL. Exige um banco novo."
python3 odoo-bin -c config/zord.conf -d "$database" --init=base,web,l10n_br,zord_brand --load-language=pt_BR --without-demo=all --stop-after-init
