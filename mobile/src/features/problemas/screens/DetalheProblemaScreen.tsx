import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Menu, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, ScreenWrapper, Button, LoadingSpinner, ErrorState, Tabs, Tab } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto, ALVO_MINIMO } from '@shared/theme/typography';
import { comAlfa } from '@shared/theme/alfa';
import { ApiError } from '@services/ApiError';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { EncaminhamentosList } from '@features/encaminhamentos/components/EncaminhamentosList';
import { EncaminharProblemaModal } from '@features/encaminhamentos/components/EncaminharProblemaModal';
import { MobilizacoesListScreen } from '@features/mobilizations/screens/MobilizacoesListScreen';
import { useMobilizacoes } from '@features/mobilizations/hooks/useMobilizacoes';
import { useProblema } from '../hooks/useProblema';
import { useApoio } from '../hooks/useApoio';
import { useImagensProblema } from '../hooks/useImagensProblema';
import { AtividadeProblema } from '../components/AtividadeProblema';
import { AlterarStatusModal } from '../components/AlterarStatusModal';
import { EvidenciasProblema } from '../components/EvidenciasProblema';
import { CabecaProblema } from '../components/CabecaProblema';
import { TrilhaStatus } from '../components/TrilhaStatus';
import { DenunciaModal } from '../components/DenunciaModal';
import { META_APOIOS, progressoMeta } from '../utils/meta';

const TAB_DETALHE = 'Detalhe';
const TAB_MUTIROES = 'Mutirões';
const TAB_ATIVIDADE = 'Atividade';

export function DetalheProblemaScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { id } = route.params as { id: number };
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const { data: problema, isLoading, isError, error, refetch } = useProblema(id);
  const { apoiar, desapoiar } = useApoio(id);
  const imagens = useImagensProblema(id);
  const mobilizacoes = useMobilizacoes({ problemaId: id, limite: 20 });
  const [menuAberto, setMenuAberto] = useState(false);
  const [denunciaAberta, setDenunciaAberta] = useState(false);
  const [encaminharAberto, setEncaminharAberto] = useState(false);
  const [statusAberto, setStatusAberto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(TAB_DETALHE);

  const voltar = () => navigation.goBack();
  const cabecalhoSimples = <Header title="Problema" onBack={voltar} />;

  if (isLoading) {
    return (
      <ScreenWrapper cabecalho={cabecalhoSimples} respiro={false}>
        <LoadingSpinner mensagem="Carregando o problema" />
      </ScreenWrapper>
    );
  }

  if (isError || !problema) {
    const naoExiste = error instanceof ApiError && error.status === 404;
    return (
      <ScreenWrapper cabecalho={cabecalhoSimples} respiro={false}>
        {naoExiste ? (
          <ErrorState
            icon="map-marker-question-outline"
            message="Este problema não existe mais."
            dica="Ele pode ter sido removido pela moderação."
          />
        ) : (
          <ErrorState message="Não deu para abrir o problema." dica="Confira sua conexão e tente de novo." onRetry={() => refetch()} />
        )}
      </ScreenWrapper>
    );
  }

  const transicoes = problema.transicoes_permitidas ?? [];
  const capaUrl = imagens.data?.find((i) => i.principal)?.url ?? imagens.data?.[0]?.url ?? null;
  const totalMutiroes = mobilizacoes.data?.pages.flat().length ?? 0;
  const enviandoApoio = apoiar.isPending || desapoiar.isPending;
  const alternarApoio = () => (problema.apoiado ? desapoiar.mutate() : apoiar.mutate());
  const organizarMutirao = () => navigation.navigate('CriarMobilizacao', { problemaId: problema.id });
  const abrirDenuncia = () => {
    setMenuAberto(false);
    setDenunciaAberta(true);
  };
  const abrirStatus = () => {
    setMenuAberto(false);
    setStatusAberto(true);
  };
  const toqueMenu = comAlfa(theme.colors.onPrimary, 0.16);

  const menu = (
    <Menu
      visible={menuAberto}
      onDismiss={() => setMenuAberto(false)}
      anchor={
        <Pressable
          onPress={() => setMenuAberto(true)}
          accessibilityRole="button"
          accessibilityLabel="Mais opções"
          style={({ pressed }) => [styles.botaoMenu, { backgroundColor: pressed ? toqueMenu : 'transparent' }]}
        >
          <MaterialCommunityIcons name="dots-vertical" size={24} color={theme.colors.onPrimary} />
        </Pressable>
      }
      contentStyle={{ backgroundColor: theme.colors.surface }}
    >
      {transicoes.length > 0 && <Menu.Item leadingIcon="swap-horizontal" title="Alterar status" onPress={abrirStatus} />}
      <Menu.Item leadingIcon="flag-outline" title="Denunciar" onPress={abrirDenuncia} />
    </Menu>
  );

  return (
    <ScreenWrapper cabecalho={<Header title="Problema" onBack={voltar} acoes={menu} />} respiro={false}>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab label={TAB_DETALHE} />
        <Tab label={TAB_MUTIROES} badge={totalMutiroes} />
        <Tab label={TAB_ATIVIDADE} />
      </Tabs>

      <View style={styles.corpo}>
        {activeTab === TAB_DETALHE && (
          <ScrollView contentContainerStyle={styles.rolagem}>
            <CabecaProblema problema={problema} capaUrl={capaUrl} />

            <View style={styles.secoes}>
              <View style={styles.secao}>
                <Text accessibilityRole="header" style={[styles.tituloSecao, { color: theme.colors.onSurface }]}>
                  Andamento
                </Text>
                <TrilhaStatus status={problema.status} />
              </View>

              <View
                accessible
                accessibilityLabel={`${problema.cont_apoios} de ${META_APOIOS} apoios para a meta`}
                style={[styles.meta, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
              >
                <View style={styles.metaLinha}>
                  <MaterialCommunityIcons name="account-group" size={22} color={theme.colors.secondary} />
                  <Text style={[styles.metaTexto, { color: theme.colors.onSurface }]}>
                    <Text style={styles.forte}>{problema.cont_apoios}</Text> de {META_APOIOS} apoios
                  </Text>
                </View>
                <View style={[styles.barra, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.barraCheia,
                      { width: `${progressoMeta(problema.cont_apoios)}%`, backgroundColor: theme.colors.secondary },
                    ]}
                  />
                </View>
              </View>

              {problema.descricao && (
                <Text style={[styles.desc, { color: theme.colors.onSurface }]}>{problema.descricao}</Text>
              )}

              <EvidenciasProblema problemaId={problema.id} podeAdicionar={problema.pode_adicionar_evidencia} />

              <View style={styles.secao}>
                <EncaminhamentosList problemaId={problema.id} />
                {problema.pode_encaminhar && (
                  <Button mode="outlined" icon="send-outline" onPress={() => setEncaminharAberto(true)} style={styles.alinhado}>
                    Encaminhar a um órgão
                  </Button>
                )}
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === TAB_MUTIROES && (
          <MobilizacoesListScreen
            problemaId={problema.id}
            onPress={(mobilizacaoId) => navigation.navigate('MobilizacaoDetail', { id: mobilizacaoId })}
            onCriar={organizarMutirao}
          />
        )}

        {activeTab === TAB_ATIVIDADE && <AtividadeProblema problemaId={problema.id} />}
      </View>

      {/* Barra fixa: a ação principal sempre na zona do polegar. */}
      <View
        style={[
          styles.barraAcoes,
          {
            paddingBottom: insets.bottom + spacing.two,
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
          },
        ]}
      >
        <Button
          mode="contained"
          icon={problema.apoiado ? 'check-circle' : 'thumb-up'}
          loading={enviandoApoio}
          disabled={enviandoApoio}
          onPress={alternarApoio}
          buttonColor={problema.apoiado ? theme.colors.primaryContainer : theme.colors.secondary}
          textColor={problema.apoiado ? theme.colors.onPrimaryContainer : theme.colors.onSecondary}
          accessibilityHint={problema.apoiado ? 'Toque para retirar o apoio' : undefined}
          accessibilityState={{ selected: problema.apoiado, busy: enviandoApoio }}
          style={styles.acaoPrincipal}
        >
          {problema.apoiado ? 'Apoiando' : 'Apoiar'}
        </Button>
        <Button mode="outlined" icon="account-group-outline" onPress={organizarMutirao} style={styles.acaoPrincipal}>
          Mutirão
        </Button>
      </View>

      <EncaminharProblemaModal
        problemaId={problema.id}
        visivel={encaminharAberto}
        onFechar={() => setEncaminharAberto(false)}
      />

      <AlterarStatusModal
        problemaId={problema.id}
        visivel={statusAberto}
        transicoes={transicoes}
        onFechar={() => setStatusAberto(false)}
      />

      <DenunciaModal
        problemaId={problema.id}
        visivel={denunciaAberta}
        onFechar={() => setDenunciaAberta(false)}
        onEnviada={() => setAviso('Denúncia enviada. Obrigado por avisar.')}
      />

      <Snackbar visible={aviso !== null} onDismiss={() => setAviso(null)} duration={4000} wrapperStyle={{ bottom: 88 }}>
        {aviso}
      </Snackbar>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  corpo: { flex: 1 },
  rolagem: { paddingBottom: spacing.five },
  secoes: { paddingHorizontal: spacing.three, paddingTop: spacing.four, gap: spacing.four },
  secao: { gap: spacing.three },
  tituloSecao: { ...texto.tituloSecao },
  meta: { borderRadius: 16, borderWidth: 1, padding: spacing.three, gap: spacing.two },
  metaLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.one },
  metaTexto: { ...texto.corpo, fontSize: 16 },
  forte: { fontWeight: '800' },
  barra: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barraCheia: { height: 8, borderRadius: 4 },
  desc: { ...texto.corpo, fontSize: 16, lineHeight: 24 },
  alinhado: { alignSelf: 'flex-start' },
  barraAcoes: {
    flexDirection: 'row',
    gap: spacing.two,
    paddingHorizontal: spacing.three,
    paddingTop: spacing.two,
    borderTopWidth: 1,
  },
  acaoPrincipal: { flex: 1 },
  botaoMenu: {
    width: ALVO_MINIMO,
    height: ALVO_MINIMO,
    borderRadius: ALVO_MINIMO / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
