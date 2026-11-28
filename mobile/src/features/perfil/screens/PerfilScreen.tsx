import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { ErrorState, LoadingSpinner, Tabs, Tab } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { comAlfa } from '@shared/theme/alfa';
import { useAppSelector } from '@store/hooks';
import { encerrarSessao } from '@shared/sessao/sessao';
import { AvisoEmailNaoConfirmado } from '@features/auth/components/AvisoEmailNaoConfirmado';
import { useReleituraDoUsuario } from '@features/auth/hooks/useReleituraDoUsuario';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { useAcoes, useApoiados, useRelatados, useResumo } from '../hooks/usePerfil';
import { CapaPerfil } from '../components/CapaPerfil';
import { CartaoIdentidade } from '../components/CartaoIdentidade';
import { FaixaAvisos } from '../components/FaixaAvisos';
import { GradeProblemas } from '../components/GradeProblemas';
import { ListaAcoes } from '../components/ListaAcoes';
import { membroDesde } from '../utils/perfil';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;
type Rotas = RootStackParamList & { Feed: undefined };

const ROLE_LABEL: Record<string, string> = {
  citizen: 'Cidadão',
  specialist: 'Especialista',
  admin: 'Moderação',
};

const ABA_RELATADOS = 'Relatados';
const ABA_APOIADOS = 'Apoiados';
const ABA_ACOES = 'Mutirões';

interface ItemMenuProps {
  icone: Icone;
  rotulo: string;
  onPress: () => void;
  perigo?: boolean;
  dica?: string;
}

function ItemMenu({ icone, rotulo, onPress, perigo, dica }: ItemMenuProps) {
  const theme = useAppTheme();
  const cor = perigo ? theme.colors.error : theme.colors.onSurface;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={dica}
      android_ripple={{ color: comAlfa(cor, 0.1) }}
      style={styles.menuItem}
    >
      <MaterialCommunityIcons name={icone} size={22} color={cor} />
      <Text style={[styles.menuTexto, { color: cor }]}>{rotulo}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
    </Pressable>
  );
}

export function PerfilScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProp<Rotas>>();
  const user = useAppSelector((state) => state.auth.user);
  const [aba, setAba] = useState(ABA_RELATADOS);

  const resumo = useResumo();
  const relatados = useRelatados();
  const apoiados = useApoiados();
  const acoes = useAcoes();
  useReleituraDoUsuario(user?.email_verified === false);

  if (!user || resumo.isLoading) return <LoadingSpinner mensagem="Carregando seu perfil" />;
  if (resumo.isError || !resumo.data) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ErrorState message="Não deu para carregar seu perfil." dica="Confira sua conexão e tente de novo." onRetry={() => resumo.refetch()} />
      </View>
    );
  }

  const abrirProblema = (id: number) => navigation.navigate('DetalheProblema', { id });
  const abrirAcao = (id: number) => navigation.navigate('MobilizacaoDetail', { id });
  const relatar = () => navigation.navigate('CriarProblema');
  const irAoFeed = () => navigation.navigate('Feed');

  const fotos = [...(relatados.data ?? []), ...(apoiados.data ?? [])]
    .map((problema) => problema.capa_url)
    .filter((url): url is string => Boolean(url));

  const papel = ROLE_LABEL[user.role] ?? user.role;
  const subtitulo = `${papel} · no Mutira desde ${membroDesde(resumo.data.membro_desde)}`;
  const ehAdmin = user.role === 'admin';

  return (
    <View style={[styles.tela, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <CapaPerfil fotos={fotos} />
        <CartaoIdentidade
          nome={user.name}
          subtitulo={subtitulo}
          numeros={[
            { valor: resumo.data.relatados, rotulo: 'relatados' },
            { valor: resumo.data.apoios_dados, rotulo: 'apoios dados' },
            { valor: resumo.data.acoes, rotulo: 'mutirões' },
          ]}
        />

        <View style={styles.aviso}>
          <AvisoEmailNaoConfirmado usuario={user} />
        </View>

        <FaixaAvisos avisos={resumo.data.avisos} onAbrirProblema={abrirProblema} onAbrirAcao={abrirAcao} />

        <Tabs value={aba} onChange={setAba} style={styles.abas}>
          <Tab label={ABA_RELATADOS} badge={resumo.data.relatados} />
          <Tab label={ABA_APOIADOS} badge={resumo.data.apoios_dados} />
          <Tab label={ABA_ACOES} badge={resumo.data.acoes} />
        </Tabs>

        {aba === ABA_RELATADOS &&
          (relatados.isLoading ? (
            <LoadingSpinner size="small" mensagem="Carregando seus relatos" />
          ) : (
            <GradeProblemas
              problemas={relatados.data ?? []}
              vazioTitulo="Nenhum relato ainda"
              vazioDescricao="Viu um buraco, lixo ou uma praça sem luz? Relate e outras pessoas podem apoiar."
              vazioAcao={{ rotulo: 'Relatar problema', icone: 'plus', onPress: relatar }}
              onAbrir={abrirProblema}
            />
          ))}
        {aba === ABA_APOIADOS &&
          (apoiados.isLoading ? (
            <LoadingSpinner size="small" mensagem="Carregando seus apoios" />
          ) : (
            <GradeProblemas
              problemas={apoiados.data ?? []}
              vazioTitulo="Nenhum apoio ainda"
              vazioDescricao="Apoiar mostra que o problema é de muita gente e ajuda a levá-lo adiante."
              vazioAcao={{ rotulo: 'Ver o que está perto', icone: 'image-text', onPress: irAoFeed }}
              onAbrir={abrirProblema}
            />
          ))}
        {aba === ABA_ACOES &&
          (acoes.isLoading ? (
            <LoadingSpinner size="small" mensagem="Carregando seus mutirões" />
          ) : (
            <ListaAcoes acoes={acoes.data ?? []} onAbrir={abrirAcao} />
          ))}

        <Text accessibilityRole="header" style={[styles.secao, { color: theme.colors.onSurface }]}>
          Conta
        </Text>
        <View style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          {ehAdmin && (
            <>
              <ItemMenu icone="shield-account-outline" rotulo="Moderação" onPress={() => navigation.navigate('Moderacao')} />
              <View style={[styles.divisor, { backgroundColor: theme.colors.outline }]} />
            </>
          )}
          <ItemMenu icone="logout" rotulo="Sair da conta" onPress={encerrarSessao} />
          <View style={[styles.divisor, { backgroundColor: theme.colors.outline }]} />
          <ItemMenu
            icone="account-remove-outline"
            rotulo="Excluir conta"
            perigo
            dica="Abre a tela de exclusão, com confirmação"
            onPress={() => navigation.navigate('ExcluirConta')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingBottom: spacing.five },
  aviso: { paddingHorizontal: spacing.three, paddingTop: spacing.three },
  abas: { marginTop: spacing.four },
  secao: { ...texto.tituloSecao, paddingHorizontal: spacing.three, paddingTop: spacing.five, paddingBottom: spacing.two },
  menu: { marginHorizontal: spacing.three, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuItem: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
    paddingHorizontal: spacing.three,
  },
  menuTexto: { ...texto.corpo, flex: 1 },
  divisor: { height: StyleSheet.hairlineWidth, marginLeft: spacing.three + 22 + spacing.two },
});
