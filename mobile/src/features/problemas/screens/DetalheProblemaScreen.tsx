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
import type { DenunciaMotivo } from '../types';
import { MobilizacoesListScreen } from '@features/mobilizations/screens/MobilizacoesListScreen';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@navigation/AppNavigator';

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  em_analise: 'Em análise',
  encaminhado: 'Encaminhado',
  resolvido: 'Resolvido',
  removido: 'Removido',
};

export function DetalheProblemaScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { id } = route.params as { id: number };
  const theme = useAppTheme();

  const { data: problema, isLoading, isError } = useProblema(id);
  const { apoiar, desapoiar } = useApoio(id);
  const denuncia = useDenuncia(id);
  const [denunciaAberta, setDenunciaAberta] = useState(false);
  const [motivo, setMotivo] = useState<string>('spam');
  const [activeTab, setActiveTab] = useState('detalhe');

  if (isLoading) return <LoadingSpinner />;
  if (isError || !problema) return <ErrorState message="Problema não encontrado." />;

  const causa = getCausa(problema.causa_id);

  return (
    <ScreenWrapper>
      <Header title="Detalhe" onBack={() => navigation.goBack()} />
      <Tabs value={activeTab} onChange={setActiveTab} style={styles.tabs}>
        <Tab label="Detalhe" icon="information-outline" />
        <Tab label="Mobilizações" icon="account-group" badge={0} />
      </Tabs>

      {activeTab === 'detalhe' && (
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
              {STATUS_LABEL[problema.status] ?? problema.status}
            </Text>
            <View style={styles.apoioRow}>
              <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primary} />
              <Text style={[styles.apoio, { color: theme.colors.onSurface }]}>
                {problema.cont_apoios} apoios
              </Text>
            </View>
          </Card>

          {problema.descricao && (
            <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant }]}>
              {problema.descricao}
            </Text>
          )}

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
        </ScrollView>
      )}

      {activeTab === 'mobilizacoes' && (
        <MobilizacoesListScreen
          problemaId={problema.id}
          onPress={(mobilizacaoId) => navigation.navigate('MobilizacaoDetail', { id: mobilizacaoId })}
        />
      )}

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
  desc: { fontSize: typography.fontSize.sm, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: spacing.two },
  modal: { padding: spacing.four, gap: spacing.three },
  modalTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  tabs: { marginBottom: spacing.three },
});