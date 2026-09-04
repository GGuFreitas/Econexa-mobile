export interface EstadoHelperText {
  visivel: boolean;
  tipo: 'error' | 'info';
  texto: string;
}

export function estadoDoHelperText(helperText?: string, erro?: boolean): EstadoHelperText {
  const texto = helperText?.trim() ?? '';
  return { visivel: texto !== '', tipo: erro ? 'error' : 'info', texto };
}
