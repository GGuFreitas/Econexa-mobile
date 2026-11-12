#!/usr/bin/env bash
set -euo pipefail
export MSYS_NO_PATHCONV=1

aqui=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
raiz=$(cd "$aqui/../.." && pwd)
imagem=postgis/postgis:15-3.4
id=mutira-backup-teste-$(date +%s)-$$
rede=$id
pg=$id-pg
caixa=$id-ferramentas
volume=$id-arquivos
senha=teste_$RANDOM$RANDOM
scripts=$aqui
if command -v cygpath >/dev/null; then scripts=$(cygpath -m "$aqui"); fi
padrao_nome='^mutira_db_[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{6}\.dump$'
conteineres=()
passo=0

etapa() { printf '\n== %s\n' "$*"; }
ok() {
  passo=$((passo + 1))
  printf '  ok %2d  %s\n' "$passo" "$*"
}
falhou() {
  printf '\n  FALHOU  %s\n' "$*" >&2
  exit 1
}
recuar() { sed 's/^/        /'; }

limpar() {
  local codigo=$? sobras
  etapa "limpeza"
  if ((${#conteineres[@]})); then docker rm -f -v "${conteineres[@]}" >/dev/null 2>&1 || true; fi
  docker volume rm "$volume" >/dev/null 2>&1 || true
  docker network rm "$rede" >/dev/null 2>&1 || true
  sobras=$(
    docker ps -a --filter "name=$id" --format '{{.Names}}'
    docker volume ls --filter "name=$id" --format '{{.Name}}'
    docker network ls --filter "name=$id" --format '{{.Name}}'
  )
  if [[ -n $sobras ]]; then printf '  sobrou: %s\n' "$sobras"; else printf '  nenhum recurso %s* sobrou\n' "$id"; fi
  if ((codigo == 0)); then printf '\nTUDO OK: %d verificações\n' "$passo"; fi
}
trap limpar EXIT

rodar() {
  local variaveis=()
  while [[ $1 == *=* ]]; do
    variaveis+=(-e "$1")
    shift
  done
  codigo=0
  saida=$(docker exec "${variaveis[@]}" "$caixa" "$@" 2>&1) || codigo=$?
}
na_caixa() { docker exec "$caixa" "$@"; }
consulta() {
  local banco=$1
  shift
  docker exec -i "$caixa" psql -X -q -t -A -v ON_ERROR_STOP=1 --dbname="$banco" "$@"
}
arquivos() { na_caixa find /backups -mindepth 1 -maxdepth 1 ! -name .backup.lock -printf '%f\n' | LC_ALL=C sort; }
conta_restaurados() { consulta postgres -c "SELECT count(*) FROM pg_database WHERE datname LIKE 'mutira\_db\_restaurado\_%'"; }
trava_livre() { na_caixa flock -n /backups/.backup.lock true 2>/dev/null; }
esquema() {
  na_caixa pg_dump --schema-only --dbname="$1" |
    sed -e "s/('\([^']*\)'::character varying)::text/'\1'::character varying/g" \
      -e 's/ANY ((ARRAY\[\([^]]*\)\])::text\[\])/ANY (ARRAY[\1])/g'
}
esperar_log() {
  local conteiner=$1 padrao=$2 limite=${3:-60} i logs=""
  for ((i = 0; i < limite; i++)); do
    logs=$(docker logs "$conteiner" 2>&1)
    if grep -qE -- "$padrao" <<<"$logs"; then return 0; fi
    sleep 1
  done
  printf '%s\n' "$logs" | recuar >&2
  falhou "não apareceu /$padrao/ no log de $conteiner em $limite s"
}
agendador() {
  c=$id-$1
  local senha_usada=$2
  shift 2
  conteineres+=("$c")
  docker run -d --name "$c" --network "$rede" \
    --mount "type=bind,source=$scripts,target=/backup,readonly" \
    --mount "type=volume,source=$volume,target=/backups" \
    -e PGHOST="$pg" -e PGUSER=admin -e PGPASSWORD="$senha_usada" -e PGDATABASE=mutira_db \
    -e TZ=America/Sao_Paulo -e BACKUP_DIR=/backups "$@" \
    "$imagem" bash /backup/agendador.sh >/dev/null
}
parar_em_menos_de() {
  local limite=$1 inicio
  inicio=$SECONDS
  docker stop -t 30 "$c" >/dev/null
  duracao=$((SECONDS - inicio))
  ((duracao < limite)) || falhou "docker stop levou $duracao s em $c (o SIGTERM não foi atendido)"
  [[ $(docker inspect -f '{{.State.ExitCode}}' "$c") == 0 ]] || falhou "$c não saiu com código 0"
}

etapa "preparação ($id)"
if grep -lU $'\r' "$aqui"/*.sh; then falhou "script com CRLF: o bash do contêiner quebra (veja .gitattributes)"; fi
ok "scripts com fim de linha LF"
[[ -f $raiz/back-end/node_modules/knex/bin/cli.js ]] || falhou "faltam as dependências do back-end: rode npm ci em back-end/"
docker image inspect "$imagem" >/dev/null 2>&1 || docker pull "$imagem"

docker network create "$rede" >/dev/null
conteineres+=("$pg")
docker run -d --name "$pg" --network "$rede" -p 127.0.0.1::5432 \
  -e POSTGRES_USER=admin -e POSTGRES_PASSWORD="$senha" -e POSTGRES_DB=mutira_db "$imagem" >/dev/null
for _ in $(seq 1 90); do
  if docker exec "$pg" pg_isready -q -h 127.0.0.1 -U admin -d mutira_db; then break; fi
  sleep 1
done
docker exec "$pg" pg_isready -q -h 127.0.0.1 -U admin -d mutira_db || falhou "o Postgres de teste não subiu"
porta=$(docker port "$pg" 5432/tcp | sed -n '1s/.*://p')
ok "Postgres descartável no ar ($imagem, porta $porta do host)"

conteineres+=("$caixa")
docker run -d --name "$caixa" --network "$rede" \
  --mount "type=bind,source=$scripts,target=/backup,readonly" \
  --mount "type=volume,source=$volume,target=/backups" \
  -e PGHOST="$pg" -e PGUSER=admin -e PGPASSWORD="$senha" -e PGDATABASE=mutira_db \
  -e TZ=America/Sao_Paulo -e BACKUP_DIR=/backups \
  --entrypoint sleep "$imagem" infinity >/dev/null
for script in "$aqui"/*.sh; do na_caixa bash -n "/backup/${script##*/}"; done
ok "caixa de ferramentas no ar (mesma imagem), scripts montados só-leitura, bash -n ok em todos"

etapa "esquema real: migrations do back-end (npm run migrate)"
(
  cd "$raiz/back-end"
  env -u DATABASE_URL_TEST NODE_ENV=development \
    DATABASE_URL="postgresql://admin:$senha@127.0.0.1:$porta/mutira_db" npm run --silent migrate
) | recuar
esperadas=$(find "$raiz/back-end/src/config/migrations" -maxdepth 1 -name '*.ts' | wc -l)
aplicadas=$(consulta mutira_db -c 'SELECT count(*) FROM knex_migrations')
((aplicadas == esperadas)) || falhou "$aplicadas migrations aplicadas, $esperadas no diretório"
ok "$aplicadas migrations aplicadas (última: $(consulta mutira_db -c 'SELECT name FROM knex_migrations ORDER BY id DESC LIMIT 1'))"

etapa "dados de exemplo"
consulta mutira_db <<'SQL'
INSERT INTO users (nome, email, senha, role, peso_voto)
SELECT 'Pessoa ' || g || CASE WHEN g % 7 = 0 THEN ' da Conceição' ELSE '' END,
       'pessoa' || g || '@exemplo.invalid',
       '$argon2id$v=19$m=19456,t=2,p=1$c2FsLWRlLXRlc3Rl$aGFzaC1maWN0aWNpby1kZS10ZXN0ZQ',
       CASE WHEN g = 1 THEN 'admin' WHEN g % 10 = 0 THEN 'specialist' ELSE 'citizen' END,
       1 + g % 3
FROM generate_series(1, 40) g;

INSERT INTO problemas (usuario_id, titulo, descricao, causa_id, tags, status, geom, local_nome, criado_em)
SELECT 1 + g % 40,
       'Problema ' || g || ' — calçada quebrada 🚧',
       CASE WHEN g % 5 = 0 THEN NULL ELSE repeat('Descrição com acentuação, "aspas" e vírgulas. ', 1 + g % 4) END,
       1 + g % 8,
       ARRAY['calçada', 'tag-' || g % 6],
       CASE WHEN g % 11 = 0 THEN 'resolvido' ELSE 'ativo' END,
       ST_SetSRID(ST_MakePoint(-46.633 + (g % 50) * 0.0007, -23.550 - (g / 50) * 0.0007), 4326),
       'São Paulo, SP',
       now() - make_interval(days => g % 30)
FROM generate_series(1, 300) g;

INSERT INTO problema_apoios (problema_id, usuario_id, peso_aplicado)
SELECT p.id, u.id, u.peso_voto FROM problemas p JOIN users u ON (p.id + u.id) % 7 = 0;

INSERT INTO problema_comentarios (problema_id, usuario_id, conteudo)
SELECT 1 + g % 300, 1 + g % 40, 'Comentário ' || g || E' com quebra\nde linha, ''apóstrofo'' e tab\t.'
FROM generate_series(1, 500) g;

INSERT INTO problema_eventos (problema_id, tipo, usuario_id, dados)
SELECT 1 + g % 300,
       (ARRAY['PROBLEMA_CRIADO', 'COMENTARIO_CRIADO', 'APOIO_CRIADO', 'STATUS_ALTERADO'])[1 + g % 4],
       CASE WHEN g % 13 = 0 THEN NULL ELSE 1 + g % 40 END,
       jsonb_build_object('n', g, 'texto', 'ação ' || g, 'lista', jsonb_build_array(g, g * 2))
FROM generate_series(1, 600) g;

INSERT INTO mobilizacoes (problema_id, usuario_id, titulo, descricao, data_inicio, data_fim, local_nome, geom,
                          status, resultado_descricao, resultado_metricas)
SELECT 1 + g % 300, 1 + g % 40, 'Mutirão ' || g, 'Limpeza da praça', now() + make_interval(days => g),
       now() + make_interval(days => g, hours => 4), 'Praça da Sé',
       CASE WHEN g % 2 = 0 THEN ST_SetSRID(ST_MakePoint(-46.634, -23.551), 4326) END,
       CASE WHEN g % 3 = 0 THEN 'realizada' ELSE 'agendada' END,
       CASE WHEN g % 3 = 0 THEN 'Recolhemos 40 sacos' END,
       CASE WHEN g % 3 = 0 THEN jsonb_build_object('sacos', 40, 'voluntarios', g) END
FROM generate_series(1, 30) g;

INSERT INTO mobilizacao_participantes (mobilizacao_id, usuario_id)
SELECT m.id, u.id FROM mobilizacoes m JOIN users u ON (m.id * u.id) % 5 = 1;

INSERT INTO problema_denuncias (problema_id, usuario_id, motivo)
SELECT p.id, u.id, 'spam' FROM problemas p JOIN users u ON p.id % 50 = 0 AND u.id <= 3;

INSERT INTO problema_encaminhamentos (problema_id, orgao_id, usuario_id, referencia, assunto, mensagem, status,
                                      enviado_em, falha_motivo)
SELECT p.id, 1 + p.id % 5, p.usuario_id, 'MUT-' || lpad(p.id::text, 6, '0'), 'Encaminhamento do problema ' || p.id,
       'Mensagem formal ao órgão.', CASE WHEN p.id % 4 = 0 THEN 'falhou' ELSE 'enviado' END, now(),
       CASE WHEN p.id % 4 = 0 THEN 'SMTP indisponível' END
FROM problemas p WHERE p.id % 10 = 0;

INSERT INTO imagens (tipo_entidade, entidade_id, url, principal, ordem)
SELECT 'problema', 1 + g % 300, 'http://localhost:9000/econexa-evidencias/problemas/' || g || '.jpg', g % 3 = 0, g % 3
FROM generate_series(1, 200) g;
SQL
linhas=$(consulta mutira_db <<'SQL'
SELECT concat_ws(' ',
  'users=' || (SELECT count(*) FROM users), 'problemas=' || (SELECT count(*) FROM problemas),
  'apoios=' || (SELECT count(*) FROM problema_apoios), 'comentarios=' || (SELECT count(*) FROM problema_comentarios),
  'eventos=' || (SELECT count(*) FROM problema_eventos), 'mobilizacoes=' || (SELECT count(*) FROM mobilizacoes),
  'participantes=' || (SELECT count(*) FROM mobilizacao_participantes),
  'denuncias=' || (SELECT count(*) FROM problema_denuncias),
  'encaminhamentos=' || (SELECT count(*) FROM problema_encaminhamentos), 'imagens=' || (SELECT count(*) FROM imagens));
SQL
)
ok "dados inseridos (acentos, emoji, NULL, jsonb, arrays, geometria): $linhas"

etapa "backup.sh por um contêiner da mesma imagem"
rodar bash /backup/backup.sh
((codigo == 0)) || falhou "backup.sh saiu com $codigo: $saida"
printf '%s\n' "$saida" | recuar
primeiro=$(arquivos)
[[ $primeiro =~ $padrao_nome ]] || falhou "esperava um único backup com nome no padrão, achei: $primeiro"
ok "um arquivo publicado, nenhum .parcial: $primeiro"
carimbo=${primeiro#mutira_db_}
carimbo=${carimbo%.dump}
distancia=$(na_caixa bash -c "echo \$((\$(date +%s) - \$(date -d '${carimbo:0:10} ${carimbo:11:2}:${carimbo:13:2}:${carimbo:15:2}' +%s)))")
((distancia >= 0 && distancia < 300)) || falhou "o nome não está no horário de São Paulo (diferença de $distancia s)"
ok "data e hora do nome no fuso America/Sao_Paulo (lidas nesse fuso, dão $distancia s atrás)"
com_dados=$(na_caixa pg_restore --list "/backups/$primeiro" | grep -c ' TABLE DATA ')
ok "pg_restore --list lê o arquivo: $com_dados tabelas com dados"

etapa "restaurar.sh num banco novo e comparação"
rodar bash /backup/restaurar.sh ultimo
((codigo == 0)) || falhou "restaurar.sh saiu com $codigo: $saida"
printf '%s\n' "$saida" | recuar
restaurado=$(consulta postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'mutira\_db\_restaurado\_%'")
[[ $restaurado =~ ^mutira_db_restaurado_[0-9]{8}_[0-9]{6}$ ]] || falhou "esperava um banco mutira_db_restaurado_<data>, achei: $restaurado"
ok "banco novo criado: $restaurado"
rodar bash /backup/conferir.sh mutira_db "$restaurado"
printf '%s\n' "$saida" | recuar
((codigo == 0)) || falhou "conferir.sh achou diferença entre o original e o restaurado"
ok "linhas, soma do conteúdo e sequências idênticas em todas as tabelas da aplicação"
brutas=$(diff <(na_caixa pg_dump --schema-only --dbname=mutira_db) <(na_caixa pg_dump --schema-only --dbname="$restaurado") | grep -c '^<' || true)
diferenca=$(diff <(esquema mutira_db) <(esquema "$restaurado") || true)
[[ -z $diferenca ]] || falhou "esquemas diferentes: $diferenca"
ok "esquema equivalente: só $brutas linhas do pg_dump --schema-only diferem, e só na grafia do cast de IN (...) em varchar"
na_caixa bash -c "pg_dump -Fc --dbname=$restaurado --file=/tmp/ponto_fixo.dump && createdb --template=template0 ponto_fixo &&
  pg_restore --no-owner --no-privileges --exit-on-error --dbname=ponto_fixo /tmp/ponto_fixo.dump"
diferenca=$(diff <(na_caixa pg_dump --schema-only --dbname="$restaurado") <(na_caixa pg_dump --schema-only --dbname=ponto_fixo) || true)
na_caixa bash -c 'dropdb ponto_fixo && rm -f /tmp/ponto_fixo.dump'
[[ -z $diferenca ]] || falhou "a grafia não estabilizou no segundo ciclo: $diferenca"
ok "a grafia estabiliza: um segundo ciclo dump/restore do restaurado dá esquema idêntico byte a byte"
for banco in mutira_db "$restaurado"; do
  consulta "$banco" >/dev/null <<'SQL' || falhou "as restrições não barram igual em $banco"
CREATE TEMP TABLE sequencias_antes AS
  SELECT 'problema_eventos_id_seq'::regclass AS sequencia, last_value, is_called FROM problema_eventos_id_seq
  UNION ALL
  SELECT 'problema_encaminhamentos_id_seq'::regclass, last_value, is_called FROM problema_encaminhamentos_id_seq;
BEGIN;
DO $$
BEGIN
  BEGIN
    INSERT INTO problema_eventos (problema_id, tipo) VALUES (1, 'TIPO_INVALIDO');
    RAISE EXCEPTION 'o CHECK de problema_eventos.tipo deixou passar um tipo inválido';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  INSERT INTO problema_eventos (problema_id, tipo) VALUES (1, 'APOIO_REMOVIDO');
  -- problema 10 tem encaminhamento "enviado" ao órgão 1; o do problema 20 "falhou".
  BEGIN
    INSERT INTO problema_encaminhamentos (problema_id, orgao_id, usuario_id, referencia, assunto, mensagem)
    VALUES (10, 1, 1, 'T', 'T', 'T');
    RAISE EXCEPTION 'uq_encaminhamento_aberto deixou passar um segundo encaminhamento aberto';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  INSERT INTO problema_encaminhamentos (problema_id, orgao_id, usuario_id, referencia, assunto, mensagem)
  VALUES (20, 1, 1, 'T', 'T', 'T');
END $$;
ROLLBACK;
SELECT setval(sequencia, last_value, is_called) FROM sequencias_antes;
SQL
done
ok "o CHECK de tipo e o índice único parcial barram (e deixam passar) igual no original e no restaurado"
extensoes=$(consulta "$restaurado" -c "SELECT string_agg(extname || ' ' || extversion, ', ' ORDER BY extname) FROM pg_extension")
ok "extensões recriadas: $extensoes"

etapa "proteção do banco principal"
rodar bash /backup/restaurar.sh ultimo mutira_db
((codigo != 0)) && grep -q -- '--sobrescrever' <<<"$saida" || falhou "restaurar.sh sobre o principal sem a flag deveria recusar: $saida"
ok "sem --sobrescrever, recusa o principal (código $codigo): $(grep ERRO <<<"$saida")"
rodar bash /backup/restaurar.sh ultimo "$restaurado"
((codigo != 0)) || falhou "restaurar.sh sobre um banco existente sem a flag deveria recusar"
ok "sem --sobrescrever, recusa também qualquer outro banco existente"
rodar bash /backup/conferir.sh mutira_db "$restaurado"
((codigo == 0)) && [[ $(conta_restaurados) == 1 ]] || falhou "a recusa alterou algum banco"
ok "nada mudou depois das recusas"

consulta mutira_db <<'SQL'
DELETE FROM problema_comentarios;
UPDATE problemas SET titulo = 'estragado' WHERE id <= 10;
INSERT INTO users (nome, email, senha) VALUES ('Intruso', 'intruso@exemplo.invalid', 'x');
SQL
rodar bash /backup/conferir.sh mutira_db "$restaurado"
((codigo == 1)) || falhou "conferir.sh deveria acusar o banco estragado (código $codigo)"
ok "conferir.sh acusa a diferença quando ela existe: $(grep -c DIFERENTE <<<"$saida") objetos marcados"

docker exec -d "$caixa" psql -X -q --dbname=mutira_db -c 'SELECT pg_sleep(600)'
sessao="SELECT count(*) FROM pg_stat_activity WHERE query LIKE '%pg_sleep(600)%' AND pid <> pg_backend_pid()"
for _ in $(seq 1 20); do
  [[ $(consulta postgres -c "$sessao") == 1 ]] && break
  sleep 0.5
done
[[ $(consulta postgres -c "$sessao") == 1 ]] || falhou "a sessão simulada não abriu"
rodar bash /backup/restaurar.sh ultimo mutira_db --sobrescrever
((codigo == 0)) || falhou "restaurar.sh --sobrescrever saiu com $codigo: $saida"
printf '%s\n' "$saida" | recuar
anterior=$(consulta postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'mutira\_db\_anterior\_%'")
[[ -n $anterior ]] || falhou "o principal antigo não foi preservado"
rodar bash /backup/conferir.sh mutira_db "$restaurado"
((codigo == 0)) || falhou "o principal não ficou igual ao backup: $saida"
ok "com --sobrescrever, o principal voltou exatamente ao conteúdo do backup"
estado=$(consulta "$anterior" -c "SELECT (SELECT count(*) FROM problema_comentarios) || '/' || (SELECT count(*) FROM users WHERE nome = 'Intruso')")
[[ $estado == 0/1 ]] || falhou "$anterior não guarda o estado anterior ($estado)"
ok "o estado anterior ficou em $anterior: 0 comentários e o intruso, como estava antes da troca"
[[ $(consulta postgres -c "$sessao") == 0 ]] || falhou "a sessão aberta no principal não foi encerrada"
ok "a sessão aberta no principal foi encerrada na troca"
novo_id=$(consulta mutira_db -c "INSERT INTO users (nome, email, senha) VALUES ('Depois do restauro', 'depois@exemplo.invalid', 'x') RETURNING id")
maior=$(consulta "$restaurado" -c 'SELECT max(id) FROM users')
((novo_id == maior + 1)) || falhou "a sequência de users não continuou do ponto certo ($novo_id depois de $maior)"
ok "o principal restaurado aceita escrita e a sequência continua de onde parou (id $novo_id)"

etapa "falhas não publicam nada"
antes=$(arquivos)
rodar PGPASSWORD=senha-errada bash /backup/backup.sh
((codigo != 0)) || falhou "backup.sh com senha errada deveria falhar"
[[ $(arquivos) == "$antes" ]] || falhou "a falha deixou arquivo para trás: $(arquivos)"
printf '%s\n' "$saida" | recuar
ok "senha errada: código $codigo, nenhum arquivo novo e nenhum .parcial"

docker exec -d "$caixa" flock /backups/.backup.lock sleep 5
for _ in $(seq 1 20); do
  trava_livre || break
  sleep 0.25
done
rodar bash /backup/backup.sh
((codigo != 0)) && grep -q 'outro backup' <<<"$saida" || falhou "dois backups ao mesmo tempo deveriam ser barrados: $saida"
[[ $(arquivos) == "$antes" ]] || falhou "o backup barrado mexeu nos arquivos"
ok "com outro backup rodando, o segundo é barrado pela trava sem mexer em nada"
for _ in $(seq 1 40); do
  trava_livre && break
  sleep 0.5
done

na_caixa bash -c "head -c \$((\$(stat -c %s /backups/$primeiro) * 6 / 10)) /backups/$primeiro > /backups/truncado.dump; echo lixo > /backups/lixo.dump"
rodar bash /backup/restaurar.sh truncado.dump
((codigo != 0)) && [[ $(conta_restaurados) == 1 ]] || falhou "restaurar um arquivo truncado deveria falhar e não deixar banco: $saida"
printf '%s\n' "$saida" | tail -n 4 | recuar
ok "arquivo truncado (60%): o --list passa, a restauração falha no meio e o banco incompleto é removido"
rodar bash /backup/restaurar.sh lixo.dump
((codigo != 0)) && [[ $(conta_restaurados) == 1 ]] || falhou "restaurar lixo deveria falhar antes de criar banco"
ok "arquivo que não é dump: recusado antes de criar qualquer banco"

etapa "retenção (BACKUP_RETENCAO_DIAS=7)"
plano=$(na_caixa bash -c '
  set -e
  cd /backups
  nome() { printf "mutira_db_%s.dump" "$(date -d "$1" +%Y-%m-%d_%H%M%S)"; }
  criar() { touch -d "$2" "$3"; printf "%s %s\n" "$1" "$3"; }
  criar remover "8 days ago" "$(nome "8 days ago")"
  criar remover "7 days ago 1 hour ago" "$(nome "7 days ago 1 hour ago")"
  criar manter "6 days ago 23 hours ago" "$(nome "6 days ago 23 hours ago")"
  criar manter "1 day ago" "$(nome "1 day ago")"
  criar remover "9 days ago" "$(nome "9 days ago").parcial"
  criar manter "30 days ago" "outro_banco_$(date -d "30 days ago" +%Y-%m-%d_%H%M%S).dump"
  criar manter "30 days ago" mutira_db_manual.dump
  criar manter "30 days ago" "$(nome "30 days ago").bak"
  criar manter "30 days ago" notas.txt
  mkdir antigos
  criar manter "60 days ago" "antigos/$(nome "60 days ago")"
  pasta=$(nome "40 days ago")
  mkdir "$pasta"
  criar manter "40 days ago" "$pasta"
')
printf '%s\n' "$plano" | recuar
antes=$(arquivos)
sleep 1
rodar BACKUP_RETENCAO_DIAS=7 bash /backup/backup.sh
((codigo == 0)) || falhou "backup.sh saiu com $codigo: $saida"
printf '%s\n' "$saida" | recuar
depois=$(arquivos)
removidos=$(LC_ALL=C comm -23 <(printf '%s\n' "$antes") <(printf '%s\n' "$depois"))
novos=$(LC_ALL=C comm -13 <(printf '%s\n' "$antes") <(printf '%s\n' "$depois"))
esperados=$(awk '$1 == "remover" { print $2 }' <<<"$plano" | LC_ALL=C sort)
[[ $removidos == "$esperados" ]] || falhou "removidos: [$removidos] esperados: [$esperados]"
ok "removidos exatamente os 3 esperados (8 dias; 7 dias e 1 hora; .parcial de 9 dias)"
while read -r acao caminho; do
  [[ $acao == manter ]] || continue
  na_caixa test -e "/backups/$caminho" || falhou "$caminho deveria ter sido mantido"
done <<<"$plano"
[[ $novos =~ $padrao_nome ]] || falhou "esperava só o backup novo, vieram: $novos"
ok "mantidos: 6 dias e 23 horas, outro banco, nomes fora do padrão, .bak, subpasta e diretório com nome de backup"

contagem=$(arquivos | wc -l)
for invalido in 0 abc 7d; do
  rodar "BACKUP_RETENCAO_DIAS=$invalido" bash /backup/backup.sh
  ((codigo != 0)) && [[ $(arquivos | wc -l) == "$contagem" ]] || falhou "BACKUP_RETENCAO_DIAS=$invalido deveria ser recusado sem fazer nada"
done
ok "BACKUP_RETENCAO_DIAS 0, abc e 7d recusados antes de qualquer dump: $(grep ERRO <<<"$saida")"

etapa "agendador: cálculo do próximo horário (agendador.sh --proxima)"
proxima() {
  local horario=$1 agora=$2 esperado=$3 fuso=${4:-America/Sao_Paulo}
  rodar "TZ=$fuso" "BACKUP_HORARIO=$horario" bash /backup/agendador.sh --proxima "$agora"
  ((codigo == 0)) && [[ $saida == "$esperado" ]] ||
    falhou "BACKUP_HORARIO=$horario agora=$agora ($fuso): veio [$saida] (código $codigo), esperado [$esperado]"
  ok "$(printf '%-5s  agora %s  %-19s -> %s' "$horario" "$agora" "($fuso)" "$saida")"
}
proxima 03:00 "2026-10-27 02:59:59" "2026-10-27 03:00:00 -0300"
proxima 03:00 "2026-10-27 03:00:00" "2026-10-28 03:00:00 -0300"
proxima 03:00 "2026-10-27 03:00:01" "2026-10-28 03:00:00 -0300"
proxima 03:00 "2026-12-31 23:59:59" "2027-01-01 03:00:00 -0300"
proxima 03:00 "2028-02-28 12:00:00" "2028-02-29 03:00:00 -0300"
proxima 23:59 "2026-10-27 23:59:30" "2026-10-28 23:59:00 -0300"
proxima 0:00 "2026-10-27 10:00:00" "2026-10-28 00:00:00 -0300"
proxima 03:00 "2026-10-27 02:00:00" "2026-10-27 03:00:00 +0000" UTC
proxima 00:30 "2018-11-03 12:00:00" "2018-11-04 01:30:00 -0200"
proxima 03:00 "2018-11-03 12:00:00" "2018-11-04 03:00:00 -0200"
proxima 00:30 "2018-11-04 12:00:00" "2018-11-05 00:30:00 -0200"
proxima 23:30 "2019-02-16 12:00:00" "2019-02-16 23:30:00 -0200"
for invalido in "BACKUP_HORARIO=24:00" "BACKUP_HORARIO=3h" "BACKUP_HORARIO=03:60" "TZ=Nao/Existe" \
  "BACKUP_AO_INICIAR=talvez" "BACKUP_TEMPO_LIMITE=2 horas"; do
  rodar "$invalido" bash /backup/agendador.sh --proxima
  ((codigo != 0)) || falhou "$invalido deveria ser recusado"
done
ok "recusados: BACKUP_HORARIO 24:00, 3h e 03:60; TZ inexistente; BACKUP_AO_INICIAR=talvez; BACKUP_TEMPO_LIMITE='2 horas'"

etapa "agendador rodando como processo do contêiner"
agendador falha senha-errada -e BACKUP_AO_INICIAR=true
esperar_log "$c" 'próximo backup'
logs=$(docker logs "$c" 2>&1)
printf '%s\n' "$logs" | recuar
grep -q 'backup falhou' <<<"$logs" || falhou "a falha não foi registrada"
sleep 2
[[ $(docker inspect -f '{{.State.Running}}' "$c") == true ]] || falhou "o agendador morreu com a falha do backup"
ok "backup com senha errada: falha registrada, agendador vivo e agendado para o próximo horário"
parar_em_menos_de 10
grep -q 'sinal recebido' <<<"$(docker logs "$c" 2>&1)" || falhou "o encerramento não foi registrado"
ok "docker stop atendido em $duracao s, código 0"

antes=$(arquivos | wc -l)
sleep 1
agendador sucesso "$senha" -e BACKUP_AO_INICIAR=true
esperar_log "$c" 'próximo backup'
logs=$(docker logs "$c" 2>&1)
printf '%s\n' "$logs" | recuar
grep -q 'concluído' <<<"$logs" || falhou "o backup de partida não concluiu"
(($(arquivos | wc -l) == antes + 1)) || falhou "o backup de partida não publicou arquivo"
ok "BACKUP_AO_INICIAR=true: backup de partida publicado e próximo horário agendado"
parar_em_menos_de 10
ok "docker stop atendido em $duracao s, código 0"

docker exec -d "$caixa" psql -X -q --dbname=mutira_db \
  -c 'BEGIN; LOCK TABLE users IN ACCESS EXCLUSIVE MODE; SELECT pg_sleep(120); COMMIT;'
travado="SELECT count(*) FROM pg_locks WHERE relation = 'users'::regclass AND mode = 'AccessExclusiveLock' AND granted"
for _ in $(seq 1 20); do
  [[ $(consulta mutira_db -c "$travado") == 1 ]] && break
  sleep 0.5
done
[[ $(consulta mutira_db -c "$travado") == 1 ]] || falhou "o lock exclusivo de teste não foi obtido"
antes=$(arquivos)
sleep 1
agendador tempo-limite "$senha" -e BACKUP_AO_INICIAR=true -e BACKUP_TEMPO_LIMITE=3s
esperar_log "$c" 'próximo backup' 30
logs=$(docker logs "$c" 2>&1)
printf '%s\n' "$logs" | recuar
grep -q 'passou de BACKUP_TEMPO_LIMITE' <<<"$logs" || falhou "o tempo limite não interrompeu o backup travado"
[[ $(arquivos) == "$antes" ]] || falhou "o backup interrompido deixou arquivo: $(arquivos)"
ok "pg_dump preso num lock: interrompido no tempo limite, .parcial removido, agendador seguiu"
parar_em_menos_de 10
consulta postgres -c "SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE query LIKE '%pg_sleep(120)%' AND pid <> pg_backend_pid()" >/dev/null

agendador configuracao "$senha" -e BACKUP_RETENCAO_DIAS=abc
for _ in $(seq 1 30); do
  [[ $(docker inspect -f '{{.State.Running}}' "$c") == false ]] && break
  sleep 1
done
[[ $(docker inspect -f '{{.State.Running}}/{{.State.ExitCode}}' "$c") == false/1 ]] ||
  falhou "configuração inválida deveria derrubar o agendador na subida"
ok "configuração inválida derruba o agendador na subida (código 1)"
docker logs "$c" 2>&1 | recuar

etapa "docker compose config"
(cd "$raiz" && docker compose config --quiet) || falhou "docker compose config recusou o arquivo"
servico=$(cd "$raiz" && docker compose config postgres-backup)
for trecho in 'image: postgis/postgis:15-3.4' 'condition: service_healthy' 'restart: unless-stopped' \
  'read_only: true' 'source: postgres_backups' 'command:'; do
  grep -qF -- "$trecho" <<<"$servico" || falhou "o serviço postgres-backup não tem '$trecho'"
done
ok "docker-compose.yml válido; postgres-backup com a imagem do banco, depends_on saudável, scripts só-leitura e volume próprio"
