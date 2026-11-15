#!/usr/bin/env bash
set -euo pipefail

componente=backup
# shellcheck source=comum.sh
source "$(dirname "${BASH_SOURCE[0]}")/comum.sh"

retencao="${BACKUP_RETENCAO_DIAS:-7}"
[[ -n ${PGDATABASE:-} ]] || falhar "defina PGDATABASE"
[[ $retencao =~ ^[0-9]{1,5}$ ]] && ((10#$retencao >= 1)) ||
  falhar "BACKUP_RETENCAO_DIAS deve ser um número inteiro de dias, de 1 a 99999 (recebido: '$retencao')"
retencao=$((10#$retencao))

case ${1:-} in
  '') ;;
  --validar) exit 0 ;;
  *) falhar "uso: backup.sh [--validar]" ;;
esac

remover() {
  local motivo=$1 lista=$2 arquivo
  [[ -n $lista ]] || return 0
  while IFS= read -r arquivo; do
    rm -f -- "$arquivo"
    log "$motivo: removido ${arquivo##*/}"
  done <<<"$lista"
}

padrao=$(padrao_backup "$PGDATABASE")
mkdir -p -- "$BACKUP_DIR"
exec 9>"$BACKUP_DIR/.backup.lock"
flock -n 9 || falhar "outro backup já está rodando neste diretório"

restos=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name "$padrao.parcial")
remover "sobra de backup interrompido" "$restos"

nome=$(nome_backup "$PGDATABASE")
final="$BACKUP_DIR/$nome"
parcial="$final.parcial"
[[ ! -e $final ]] || falhar "$nome já existe; nada foi sobrescrito"

publicado=false
ao_sair() {
  local codigo=$?
  rm -f -- "$parcial"
  if ((codigo == 0)); then
    return 0
  elif [[ $publicado == true ]]; then
    log "ERRO: $nome foi publicado, mas a etapa seguinte falhou (código $codigo)" >&2
  else
    log "ERRO: backup falhou (código $codigo); nenhum arquivo novo foi publicado" >&2
  fi
}
trap ao_sair EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

log "iniciando: banco '$PGDATABASE' em ${PGHOST:-socket local}:${PGPORT:-5432} -> $nome"
inicio=$SECONDS
pg_dump --format=custom --no-password --file="$parcial"

indice=$(pg_restore --list "$parcial")
pg_restore --file=/dev/null "$parcial"
com_dados=$(grep -c ' TABLE DATA ' <<<"$indice" || true)

sync -- "$parcial"
mv -- "$parcial" "$final"
sync -- "$BACKUP_DIR"
publicado=true
tamanho=$(numfmt --to=iec --suffix=B "$(stat -c %s -- "$final")")
log "concluído: $nome ($tamanho em $((SECONDS - inicio)) s; conferido: $com_dados tabelas com dados no índice e leitura completa sem erro)"

antigos=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name "$padrao" -mmin "+$((retencao * 1440))" | sort)
remover "retenção de $retencao dias" "$antigos"
guardados=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name "$padrao" | wc -l)
livre=$(df -P -h -- "$BACKUP_DIR" | awk 'NR == 2 { print $4 }')
log "retenção: $guardados backup(s) guardado(s), $livre livres no volume"
