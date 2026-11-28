import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { MarcadorVisual, rotuloDoMarcador } from './MarcadorVisual';
import { ClusterVisual } from './ClusterVisual';
import type { MapaBaseProps } from './mapaBase.types';

const GRADE = 40;

/**
 * Na web não há mapa nativo (react-native-maps não roda no navegador).
 * Esta versão desenha os mesmos marcadores sobre uma grade, projetando lat/lng
 * na região atual, para que a tela possa ser vista e testada no navegador.
 */
export function MapaBase({ regiaoInicial, regiao, clusters, onSelecionar, onAproximar }: MapaBaseProps) {
  const theme = useAppTheme();
  const [tamanho, setTamanho] = useState({ largura: 0, altura: 0 });
  const r = regiao ?? regiaoInicial;

  const medir = (e: LayoutChangeEvent) =>
    setTamanho({ largura: e.nativeEvent.layout.width, altura: e.nativeEvent.layout.height });

  const projetar = (lat: number, lng: number) => ({
    left: ((lng - (r.longitude - r.longitudeDelta / 2)) / r.longitudeDelta) * tamanho.largura,
    top: (((r.latitude + r.latitudeDelta / 2) - lat) / r.latitudeDelta) * tamanho.altura,
  });

  const linhasV = Array.from({ length: Math.ceil(tamanho.largura / GRADE) }, (_, i) => i * GRADE);
  const linhasH = Array.from({ length: Math.ceil(tamanho.altura / GRADE) }, (_, i) => i * GRADE);

  return (
    <View
      onLayout={medir}
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surfaceVariant }]}
    >
      {linhasV.map((x) => (
        <View key={`v${x}`} style={[styles.linhaV, { left: x, backgroundColor: theme.colors.outline }]} />
      ))}
      {linhasH.map((y) => (
        <View key={`h${y}`} style={[styles.linhaH, { top: y, backgroundColor: theme.colors.outline }]} />
      ))}
      {tamanho.largura > 0 &&
        clusters.map((grupo) => {
          const pos = projetar(grupo.coordenada.latitude, grupo.coordenada.longitude);
          const unico = grupo.pontos.length === 1;
          const aoTocar = unico ? () => onSelecionar(grupo.pontos[0]) : () => onAproximar(grupo);
          return (
            <Pressable
              key={grupo.id}
              onPress={aoTocar}
              accessibilityRole="button"
              accessibilityLabel={unico ? rotuloDoMarcador(grupo.pontos[0]) : `${grupo.pontos.length} problemas aqui. Toque para aproximar.`}
              style={[styles.ponto, { left: pos.left, top: pos.top }]}
            >
              {unico ? <MarcadorVisual problema={grupo.pontos[0]} /> : <ClusterVisual pontos={grupo.pontos} />}
            </Pressable>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  linhaV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  linhaH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  ponto: { position: 'absolute', transform: [{ translateX: '-50%' }, { translateY: '-50%' }] },
});
