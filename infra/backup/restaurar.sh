#!/usr/bin/env bash
set -euo pipefail

componente=restauro
# shellcheck source=comum.sh
source "$(dirname "${BASH_SOURCE[0]}")/comum.sh"

uso() {
  cat <<'TEXTO'
uso: restaurar.sh <arquivo|ultimo> [banco_destino] [--sobrescrever]

  arquivo        caminho do .dump; um nome solto é procurado em BACKUP_DIR;
                 "ultimo" pega o backup mais recente de PGDATABASE em BACKUP_DIR
  banco_destino  padrão: um banco NOVO, <PGDATABASE>_restaurado_<data>
  --sobrescrever necessário quando o destino já existe (o principal inclusive). Nada
                 é apagado: o backup vai para um banco novo e, só depois de restaurado,
                 os nomes trocam numa transação; o antigo fica como
                 <destino>_anterior_<data>.
TEXTO
}

arquivo="" destino="" sobrescrever=false
for argumento in "$@"; do
  case $argumento in
    --sobrescrever) sobrescrever=true ;;
    -h | --help)
      uso
      exit 0
      ;;
    -*) falhar "opção desconhecida: $argumento" ;;
    *)
      if [[ -z $arquivo ]]; then
        arquivo=$argumento
      elif [[ -z $destino ]]; then
        destino=$argumento
      else
        falhar "argumentos demais (veja --help)"
      fi
      ;;
  esac
done
if [[ -z $arquivo ]]; then
  uso >&2
  exit 2
fi
[[ -n ${PGDATABASE:-} ]] || falhar "defina PGDATABASE (o banco principal)"

sql() { psql -X -q -t -A -v ON_ERROR_STOP=1 --no-password --dbname=postgres -c "$1"; }
existe() { [[ $(sql "SELECT count(*) FROM pg_database WHERE datname = '$1'") == 1 ]]; }
nome_valido() { [[ $1 =~ ^[a-z_][a-z0-9_]*$ && ${#1} -le 63 ]]; }

if [[ $arquivo == ultimo ]]; then
  ultimo=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name "$(padrao_backup "$PGDATABASE")" -printf '%f\n' | sort | tail -n 1)
  [[ -n $ultimo ]] || falhar "nenhum backup de '$PGDATABASE' em $BACKUP_DIR"
  arquivo=$BACKUP_DIR/$ultimo
elif [[ ! -f $arquivo && $arquivo != */* && -f $BACKUP_DIR/$arquivo ]]; then
  arquivo=$BACKUP_DIR/$arquivo
fi
[[ -f $arquivo ]] || falhar "arquivo não encontrado: $arquivo"
pg_restore --list "$arquivo" >/dev/null || falhar "$arquivo não é um backup que o pg_restore consiga ler"

sql 'SELECT 1' >/dev/null ||
  falhar "sem conexão com ${PGHOST:-socket local}:${PGPORT:-5432} (confira PGHOST, PGUSER e PGPASSWORD)"
carimbo=$(date '+%Y%m%d_%H%M%S')
destino=${destino:-${PGDATABASE}_restaurado_${carimbo}}
nome_valido "$destino" ||
  falhar "nome de banco inválido: '$destino' (minúsculas, dígitos e _, até 63 caracteres)"

substituir=false
alvo=$destino
anterior=""
if existe "$destino"; then
  [[ $sobrescrever == true ]] ||
    falhar "o banco '$destino' já existe e não foi alterado. Para trocá-lo pelo conteúdo do backup, repita com --sobrescrever (o atual ficará preservado como ${destino}_anterior_${carimbo})."
  substituir=true
  alvo=${destino}_restauro_${carimbo}
  anterior=${destino}_anterior_${carimbo}
  nome_valido "$alvo" && nome_valido "$anterior" ||
    falhar "'$destino' é longo demais para os nomes auxiliares (o Postgres corta nomes em 63 caracteres)"
fi

criado="" restaurado=false bloqueado=""
ao_sair() {
  local codigo=$?
  ((codigo != 0)) || return 0
  if [[ -n $bloqueado ]]; then
    if sql "ALTER DATABASE \"$bloqueado\" ALLOW_CONNECTIONS true" >/dev/null 2>&1; then
      log "conexões com '$bloqueado' liberadas de novo"
    else
      log "ATENÇÃO: libere as conexões à mão: ALTER DATABASE \"$bloqueado\" ALLOW_CONNECTIONS true;"
    fi
  fi
  if [[ -n $criado && $restaurado == false ]]; then
    if sql "DROP DATABASE IF EXISTS \"$criado\" WITH (FORCE)" >/dev/null 2>&1; then
      log "banco incompleto '$criado' removido"
    else
      log "ATENÇÃO: não consegui remover o banco incompleto '$criado'"
    fi
  elif [[ -n $criado ]]; then
    log "o backup ficou restaurado em '$criado', mas a troca de nomes não aconteceu; '$destino' continua como estava"
  fi
  log "ERRO: restauração falhou (código $codigo)" >&2
}
trap ao_sair EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

log "restaurando ${arquivo##*/} no banco novo '$alvo'"
sql "CREATE DATABASE \"$alvo\" TEMPLATE template0"
criado=$alvo
inicio=$SECONDS
pg_restore --no-owner --no-privileges --exit-on-error --no-password --dbname="$alvo" "$arquivo"
psql -X -q -v ON_ERROR_STOP=1 --no-password --dbname="$alvo" -c 'ANALYZE'
restaurado=true
log "restauração concluída em $((SECONDS - inicio)) s"

if [[ $substituir == true ]]; then
  log "trocando '$destino' pelo banco restaurado; as conexões abertas com ele serão encerradas"
  sql "ALTER DATABASE \"$destino\" ALLOW_CONNECTIONS false"
  bloqueado=$destino
  encerradas=$(sql "SELECT count(*) FILTER (WHERE pg_terminate_backend(pid)) FROM pg_stat_activity WHERE datname = '$destino' AND pid <> pg_backend_pid()")
  psql -X -q -v ON_ERROR_STOP=1 --no-password --dbname=postgres <<SQL
BEGIN;
ALTER DATABASE "$destino" RENAME TO "$anterior";
ALTER DATABASE "$alvo" RENAME TO "$destino";
COMMIT;
SQL
  criado="" bloqueado=$anterior
  sql "ALTER DATABASE \"$anterior\" ALLOW_CONNECTIONS true"
  bloqueado=""
  log "'$destino' agora tem o conteúdo do backup ($encerradas conexão(ões) encerrada(s))"
  log "o banco anterior ficou preservado como '$anterior'; depois de conferir, apague com: DROP DATABASE \"$anterior\";"
fi

tabelas=$(psql -X -q -t -A --no-password --dbname="$destino" -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")
migracao=$(psql -X -q -t -A --no-password --dbname="$destino" -c 'SELECT name FROM knex_migrations ORDER BY id DESC LIMIT 1' 2>/dev/null || true)
log "pronto: '$destino' tem $tabelas tabelas em public; última migration: ${migracao:-(sem knex_migrations)}"
if [[ $substituir == false ]]; then
  log "o banco '$PGDATABASE' não foi tocado. Para comparar: bash $(dirname "${BASH_SOURCE[0]}")/conferir.sh $PGDATABASE $destino"
  log "quando não precisar mais: DROP DATABASE \"$destino\";"
fi
