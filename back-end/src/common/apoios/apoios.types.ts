export interface ContadoresApoio {
  cont_apoios: number;
  cont_apoios_ponderados: number;
}

export interface ApoioResultado extends ContadoresApoio {
  apoiado: boolean;
}
