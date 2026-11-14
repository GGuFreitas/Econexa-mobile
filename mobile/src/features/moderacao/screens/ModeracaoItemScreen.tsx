import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MensagemDeRetorno } from '@features/auth/components/MensagemDeRetorno';
import { Button, Card, Header, ScreenWrapper, TextInput } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { mensagemDeErro } from '@shared/utils/mensagemDeErro';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { useBloquearConta } from '../hooks/useBloquearConta';
import { useDesbloquearConta } from '../hooks/useDesbloquearConta';
import { useDescartarDenuncias } from '../hooks/useDescartarDenuncias';
import { useRemoverProblema } from '../hooks/useRemoverProblema';
import { resumoDosMotivos } from '../utils/motivos';

type ModeracaoItemNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ModeracaoItemRouteProp = RouteProp<RootStackParamList, 'ModeracaoItem'>;
type Retorno = { texto: string; tipo: 'erro' | 'sucesso' };

const MOTIVO_MINIMO = 3;

function confirmar(titulo: string, mensagem: string, rotulo: string, acao: () => void): void {
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: rotulo, style: 'destructive', onPress: acao },
  ]);
}

export default function ModeracaoItemScreen() {
  const navigation = useNavigation<ModeracaoItemNavigationProp>();
  const { params } = useRoute<ModeracaoItemRouteProp>();
  const { item } = params;
  const theme = useAppTheme();
  const remover = useRemoverProblema();
  const descartar = useDescartarDenuncias();
  const bloquear = useBloquearConta();
  const desbloquear = useDesbloquearConta();
  const [autorBloqueado, setAutorBloqueado] = useState(item.autor_bloqueado);
  const [motivoDoBloqueio, setMotivoDoBloqueio] = useState('');
  const [retorno, setRetorno] = useState<Retorno | null>(null);

  const executar = async (acao: () => Promise<unknown>, sucesso: string, voltar: boolean) => {
    setRetorno(null);
    try {
      await acao();
      if (voltar) navigation.goBack();
      else setRetorno({ texto: sucesso, tipo: 'sucesso' });
    } catch (erro) {
      setRetorno({ texto: mensagemDeErro(erro, 'Não foi possível concluir a ação.'), tipo: 'erro' });
    }
  };

  const removerProblema = () =>
    executar(() => remover.mutateAsync(item.problema_id), 'Problema removido.', true);
  const descartarDenuncias = () =>
    executar(() => descartar.mutateAsync(item.problema_id), 'Denúncias descartadas.', true);
  const bloquearAutor = () =>
    executar(
      async () => {
        await bloquear.mutateAsync({ usuarioId: item.autor_id, motivo: motivoDoBloqueio.trim() });
        setAutorBloqueado(true);
      },
      'Conta bloqueada.',
      false,
    );

  const handleVerProblema = () => navigation.navigate('DetalheProblema', { id: item.problema_id });
  const handleRemover = () =>
    confirmar(
      'Remover problema',
      'O problema some do mapa e do feed para todo mundo.',
      'Remover',
      removerProblema,
    );
  const handleDescartar = () =>
    confirmar(
      'Descartar denúncias',
      'O problema continua publicado e sai desta fila.',
      'Descartar',
      descartarDenuncias,
    );
  const handleBloquear = () =>
    confirmar(
      'Bloquear autor',
      `${item.autor_nome} sai de todos os aparelhos e não consegue mais entrar.`,
      'Bloquear',
      bloquearAutor,
    );
  const handleDesbloquear = () =>
    executar(
      async () => {
        await desbloquear.mutateAsync(item.autor_id);
        setAutorBloqueado(false);
      },
      'Conta desbloqueada.',
      false,
    );
  const handleVoltar = () => navigation.goBack();

  const motivos = resumoDosMotivos(item.motivos);
  const resumo = `${item.total_denuncias} ${item.total_denuncias === 1 ? 'denúncia' : 'denúncias'} · por ${item.autor_nome}`;

  return (
    <ScreenWrapper>
      <Header title="Denúncia" onBack={handleVoltar} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>{item.titulo}</Text>
          <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]}>{resumo}</Text>
          {motivos.map(({ rotulo, quantidade }) => (
            <Text key={rotulo} style={[styles.texto, { color: theme.colors.onSurface }]}>
              {`${rotulo}: ${quantidade}`}
            </Text>
          ))}
          <Button mode="text" onPress={handleVerProblema}>
            Ver problema
          </Button>
        </Card>

        <MensagemDeRetorno texto={retorno?.texto ?? null} tipo={retorno?.tipo} />

        <View style={styles.acoes}>
          <Button
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            icon="delete"
            onPress={handleRemover}
            loading={remover.isPending}
            disabled={remover.isPending}
          >
            Remover problema
          </Button>
          <Button
            mode="outlined"
            icon="check"
            onPress={handleDescartar}
            loading={descartar.isPending}
            disabled={descartar.isPending}
          >
            Descartar denúncias
          </Button>
        </View>

        <Card style={styles.card}>
          <Text style={[styles.subtitulo, { color: theme.colors.onSurface }]}>
            {`Conta de ${item.autor_nome}`}
          </Text>
          {autorBloqueado ? (
            <Button
              mode="outlined"
              icon="account-check"
              onPress={handleDesbloquear}
              loading={desbloquear.isPending}
              disabled={desbloquear.isPending}
            >
              Desbloquear autor
            </Button>
          ) : (
            <>
              <TextInput
                label="Motivo do bloqueio"
                value={motivoDoBloqueio}
                onChangeText={setMotivoDoBloqueio}
              />
              <Button
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
                icon="account-cancel"
                onPress={handleBloquear}
                loading={bloquear.isPending}
                disabled={bloquear.isPending || motivoDoBloqueio.trim().length < MOTIVO_MINIMO}
              >
                Bloquear autor
              </Button>
            </>
          )}
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.three, gap: spacing.three },
  card: { padding: spacing.three, gap: spacing.two },
  acoes: { gap: spacing.two },
  titulo: { fontSize: typography.fontSize.md, fontWeight: '700' },
  subtitulo: { fontSize: typography.fontSize.base, fontWeight: '600' },
  texto: { fontSize: typography.fontSize.sm },
});
