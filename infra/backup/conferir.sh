#!/usr/bin/env bash
set -euo pipefail

componente=conferencia
# shellcheck source=comum.sh
source "$(dirname "${BASH_SOURCE[0]}")/comum.sh"

(($# == 2)) || falhar "uso: conferir.sh <banco_a> <banco_b>"

export PGTZ=UTC PGDATESTYLE=ISO

resumo() {
  psql -X -q -t -A -F ' ' -v ON_ERROR_STOP=1 --no-password --dbname="$1" <<'SQL' | LC_ALL=C sort
WITH objetos AS (
  SELECT c.relkind, n.nspname, c.relname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p', 'S')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg\_%'
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d
      WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e'
    )
)
SELECT CASE WHEN relkind = 'S'
  THEN format('SELECT %L, last_value, CASE WHEN is_called THEN %L ELSE %L END FROM %I.%I',
              nspname || '.' || relname, 'usada', 'nao-usada', nspname, relname)
  ELSE format('SELECT %L, count(*), coalesce(sum(hashtextextended(_linha_::text, 0)), 0) FROM %I.%I AS _linha_',
              nspname || '.' || relname, nspname, relname)
END
FROM objetos
\gexec
SQL
}

a=$(resumo "$1")
b=$(resumo "$2")

comparar() {
  LC_ALL=C join -a 1 -a 2 -e ausente -o 0,1.2,2.2,1.3,2.3 <(printf '%s\n' "$a") <(printf '%s\n' "$b") |
    awk -v a="$1" -v b="$2" '
      BEGIN { la = length(a) < 10 ? 10 : length(a); lb = length(b) < 10 ? 10 : length(b)
              printf "%-40s %*s %*s\n", "objeto", la, a, lb, b }
      { diferente = ($2 != $3 || $4 != $5)
        if (diferente) n++
        printf "%-40s %*s %*s%s\n", $1, la, $2, lb, $3, diferente ? "  <- DIFERENTE" : "" }
      END { exit n > 0 }'
}

if comparar "$1" "$2"; then
  log "iguais: $(grep -c . <<<"$a") tabelas e sequências conferidas (linhas, conteúdo e valor)"
else
  log "DIFERENTES: veja as linhas marcadas acima" >&2
  exit 1
fi
