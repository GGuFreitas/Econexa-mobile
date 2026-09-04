const MINUTO = 60;
const HORA = MINUTO * 60;
const DIA = HORA * 24;
const SEMANA = DIA * 7;
const MES = DIA * 30;
const ANO = DIA * 365;

function pluralizar(valor: number, singular: string, plural: string): string {
  return `há ${valor} ${valor === 1 ? singular : plural}`;
}

export function formatarDataRelativa(data: string, referencia: Date = new Date()): string {
  const timestamp = new Date(data).getTime();
  if (Number.isNaN(timestamp)) return '';

  const segundos = Math.floor((referencia.getTime() - timestamp) / 1000);
  if (segundos < MINUTO) return 'agora';
  if (segundos < HORA) return pluralizar(Math.floor(segundos / MINUTO), 'minuto', 'minutos');
  if (segundos < DIA) return pluralizar(Math.floor(segundos / HORA), 'hora', 'horas');
  if (segundos < SEMANA) return pluralizar(Math.floor(segundos / DIA), 'dia', 'dias');
  if (segundos < MES) return pluralizar(Math.floor(segundos / SEMANA), 'semana', 'semanas');
  if (segundos < ANO) return pluralizar(Math.floor(segundos / MES), 'mês', 'meses');
  return pluralizar(Math.floor(segundos / ANO), 'ano', 'anos');
}
