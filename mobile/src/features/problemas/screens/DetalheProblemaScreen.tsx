import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Header,
  ScreenWrapper,
  Card,
  Button,
  Chip,
  Modal,
  Select,
  LoadingSpinner,
  ErrorState,
  Tabs,
  Tab,
} from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { useProblema } from '../hooks/useProblema';
import { useApoio } from '../hooks/useApoio';
import { useDenuncia } from '../hooks/useDenuncia';
import { getCausa } from '../map/markerConfig';
import { AtividadeProblema } from '../components/AtividadeProblema';
import { AlterarStatusModal } from '../components/AlterarStatusModal';
import { EvidenciasProblema } from '../components/EvidenciasProblema';
import { rotuloStatus } from '../utils/status';
import { EncaminhamentosList } from '@features/encaminhamentos/components/EncaminhamentosList';
import { EncaminharProblemaModal } from '@features/encaminhamentos/components/EncaminharProblemaModal';
import type { DenunciaMotivo } from '../types';
import { MobilizacoesListScreen } from '@features/mobilizations/screens/MobilizacoesListScreen';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@navigation/AppNavigator';

const TAB_DETALHE = 'Detalhe';
const TAB_MOBILIZACOES = 'Mobilizações';
const TAB_ATIVIDADE = 'Atividade';

export function DetalheProblemaScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { id } = route.params as { id: number };
  const theme = useAppTheme();

  const { data: problema, isLoading, isError } = useProblema(id);
  const { apoiar, desapoiar } = useApoio(id);
  const denuncia = useDenuncia(id);
  const [denunciaAberta, setDenunciaAberta] = useState(false);
  const [encaminharAberto, setEncaminharAberto] = useState(false);
  const [statusAberto, setStatusAberto] = useState(false);
  const [motivo, setMotivo] = useState<string>('spam');
  const [activeTab, setActiveTab] = useState(TAB_DETALHE);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !problema) return <ErrorState message="Problema não encontrado." />;

  const causa = getCausa(problema.causa_id);
  const transicoes = problema.transicoes_permitidas ?? [];

  return (
    <ScreenWrapper>
      <Header title="Detalhe" onBack={() => navigation.goBack()} />
      <Tabs value={activeTab} onChange={setActiveTab} style={styles.tabs}>
        <Tab label={TAB_DETALHE} icon="information-outline" />
        <Tab label={TAB_MOBILIZACOES} icon="account-group" />
        <Tab label={TAB_ATIVIDADE} icon="timeline-clock-outline" />
      </Tabs>

      {activeTab === TAB_DETALHE && (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={[styles.iconWrap, { backgroundColor: causa.cor }]}>
            <MaterialCommunityIcons
              name={causa.icone as keyof typeof MaterialCommunityIcons.glyphMap}
              size={32}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>{problema.titulo}</Text>
          <Chip compact>{causa.nome}</Chip>
          {problema.local_nome && (
            <Text style={[styles.local, { color: theme.colors.onSurfaceVariant }]}>
              {problema.local_nome}
            </Text>
          )}

          <Card style={styles.card}>
            <Text style={[styles.statusLabel, { color: theme.colors.onSurfaceVariant }]}>Status</Text>
            <Text style={[styles.status, { color: causa.cor }]}>
              {rotuloStatus(problema.status)}
            </Text>
            <View style={styles.apoioRow}>
              <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primary} />
              <Text style={[styles.apoio, { color: theme.colors.onSurface }]}>
                {problema.cont_apoios} apoios
              </Text>
            </View>
            {transicoes.length > 0 && (
              <Button
                mode="outlined"
                icon="swap-horizontal"
                onPress={() => setStatusAberto(true)}
                style={styles.acaoStatus}
              >
                Alterar status
              </Button>
            )}
          </Card>

          {problema.descricao && (
            <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant }]}>
              {problema.descricao}
            </Text>
          )}

          <EvidenciasProblema
            problemaId={problema.id}
            podeAdicionar={problema.pode_adicionar_evidencia}
          />

          <View style={styles.actions}>
            <Button
              mode="contained"
              icon="thumb-up"
              loading={apoiar.isPending || desapoiar.isPending}
              onPress={() => apoiar.mutate()}
              style={{ flex: 1 }}
            >
              Apoiar
            </Button>
            <Button mode="outlined" icon="flag" onPress={() => setDenunciaAberta(true)}>
              Denunciar
            </Button>
          </View>

          {problema.pode_encaminhar && (
            <Button mode="contained" icon="send" onPress={() => setEncaminharAberto(true)}>
              Encaminhar problema
            </Button>
          )}

          <EncaminhamentosList problemaId={problema.id} />
        </ScrollView>
      )}

      {activeTab === TAB_MOBILIZACOES && (
        <MobilizacoesListScreen
          problemaId={problema.id}
          onPress={(mobilizacaoId) => navigation.navigate('MobilizacaoDetail', { id: mobilizacaoId })}
        />
      )}

      {activeTab === TAB_ATIVIDADE && <AtividadeProblema problemaId={problema.id} />}

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

      <Modal visible={denunciaAberta} onDismiss={() => setDenunciaAberta(false)}>
        <View style={styles.modal}>
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Denunciar</Text>
          <Select
            label="Motivo"
            value={motivo}
            onValueChange={(v) => setMotivo(String(v))}
            options={[
              { label: 'Spam', value: 'spam' },
              { label: 'Conteúdo inadequado', value: 'conteudo_inadequado' },
              { label: 'Duplicado', value: 'duplicado' },
              { label: 'Outro', value: 'outro' },
            ]}
          />
          <Button
            mode="contained"
            loading={denuncia.isPending}
            onPress={() =>
              denuncia.mutate(motivo as DenunciaMotivo, {
                onSuccess: () => setDenunciaAberta(false),
              })
            }
          >
            Enviar denúncia
          </Button>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.four, gap: spacing.three },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: typography.fontSize.xl, fontWeight: '700' },
  local: { fontSize: typography.fontSize.sm },
  card: { gap: spacing.two },
  statusLabel: { fontSize: typography.fontSize.sm },
  status: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  apoioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  apoio: { fontSize: typography.fontSize.base, fontWeight: '600' },
  acaoStatus: { alignSelf: 'flex-start' },
  desc: { fontSize: typography.fontSize.sm, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: spacing.two },
  modal: { padding: spacing.four, gap: spacing.three },
  modalTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  tabs: { marginBottom: spacing.three },
});
