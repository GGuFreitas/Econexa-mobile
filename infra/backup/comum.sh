# shellcheck shell=bash

export TZ="${TZ:-America/Sao_Paulo}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

log() { printf '%s [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %z')" "${componente:-backup}" "$*"; }
falhar() {
  log "ERRO: $*" >&2
  exit 1
}

[[ -f "${TZDIR:-/usr/share/zoneinfo}/${TZ#:}" ]] || falhar "fuso '$TZ' não existe nesta imagem"

nome_backup() { printf '%s_%s.dump' "${1//[^A-Za-z0-9_-]/_}" "$(date '+%Y-%m-%d_%H%M%S')"; }
padrao_backup() {
  printf '%s_[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]_[0-9][0-9][0-9][0-9][0-9][0-9].dump' \
    "${1//[^A-Za-z0-9_-]/_}"
}
