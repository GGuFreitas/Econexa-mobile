#!/usr/bin/env bash
set -euo pipefail

componente=agendador
aqui=$(dirname "${BASH_SOURCE[0]}")
# shellcheck source=comum.sh
source "$aqui/comum.sh"

horario="${BACKUP_HORARIO:-03:00}"
ao_iniciar="${BACKUP_AO_INICIAR:-false}"
tempo_limite="${BACKUP_TEMPO_LIMITE:-2h}"
filho=""
em_backup=false

[[ $horario =~ ^([01]?[0-9]|2[0-3]):[0-5][0-9]$ ]] ||
  falhar "BACKUP_HORARIO inválido: '$horario' (use HH:MM, de 00:00 a 23:59)"
case $ao_iniciar in
  true | 1 | sim) ao_iniciar=true ;;
  false | 0 | nao | '') ao_iniciar=false ;;
  *) falhar "BACKUP_AO_INICIAR inválido: '$ao_iniciar' (use true ou false)" ;;
esac
[[ $tempo_limite =~ ^[1-9][0-9]*[smh]?$ ]] ||
  falhar "BACKUP_TEMPO_LIMITE inválido: '$tempo_limite' (exemplos: 90m, 2h)"

instante() {
  date -d "$1 $horario" +%s 2>/dev/null && return 0
  date -d "$1 $horario $(date -d "@$(($(date -d "$1 12:00" +%s) - 86400))" +%z)" +%s
}

dia_seguinte() {
  date -d "@$(($(date -d "$1 12:00" +%s) + 86400))" +%F
}

proxima_execucao() {
  local agora=$1 dia alvo
  dia=$(date -d "@$agora" +%F)
  alvo=$(instante "$dia")
  if ((alvo <= agora)); then
    dia=$(dia_seguinte "$dia")
    alvo=$(instante "$dia")
  fi
  printf '%s\n' "$alvo"
}

if [[ ${1:-} == --proxima ]]; then
  agora=$(date -d "${2:-now}" +%s) || falhar "data inválida: '${2:-}'"
  alvo=$(proxima_execucao "$agora")
  date -d "@$alvo" '+%Y-%m-%d %H:%M:%S %z'
  exit 0
fi
(($# == 0)) || falhar "uso: agendador.sh [--proxima [AGORA]]"

dormir() {
  sleep "$1" &
  filho=$!
  wait "$filho" || true
  filho=""
}

encerrar() {
  if [[ $em_backup == true ]]; then
    log "sinal recebido; interrompendo o backup em andamento e encerrando"
  else
    log "sinal recebido; encerrando"
  fi
  if [[ -n $filho ]]; then
    kill -TERM "$filho" 2>/dev/null || true
    wait "$filho" 2>/dev/null || true
  fi
  exit 0
}
trap encerrar TERM INT

aguardar_ate() {
  local falta
  while :; do
    falta=$(($1 - $(date +%s)))
    ((falta > 0)) || return 0
    dormir $((falta < 60 ? falta : 60))
  done
}

esperar_banco() {
  local tentativa
  for tentativa in $(seq 1 60); do
    pg_isready --quiet && return 0
    if ((tentativa == 1)); then log "aguardando o banco aceitar conexões"; fi
    dormir 2
  done
  log "o banco não respondeu em 2 minutos; tentando o backup assim mesmo"
}

executar_backup() {
  local codigo=0
  em_backup=true
  timeout --kill-after=1m "$tempo_limite" bash "$aqui/backup.sh" &
  filho=$!
  wait "$filho" || codigo=$?
  filho=""
  em_backup=false
  case $codigo in
    0) return 0 ;;
    124) log "backup interrompido: passou de BACKUP_TEMPO_LIMITE ($tempo_limite)" ;;
    *) log "backup falhou (código $codigo)" ;;
  esac
  log "o agendador continua; nova tentativa no próximo horário"
}

bash "$aqui/backup.sh" --validar || falhar "configuração do backup inválida; corrija e suba de novo"
log "iniciado: backup diário às $horario ($TZ), retenção de ${BACKUP_RETENCAO_DIAS:-7} dias," \
  "tempo limite de $tempo_limite, backup ao iniciar: $ao_iniciar"

if [[ $ao_iniciar == true ]]; then
  esperar_banco
  executar_backup
fi
while :; do
  alvo=$(proxima_execucao "$(date +%s)")
  log "próximo backup: $(date -d "@$alvo" '+%Y-%m-%d %H:%M %z')"
  aguardar_ate "$alvo"
  executar_backup
done
