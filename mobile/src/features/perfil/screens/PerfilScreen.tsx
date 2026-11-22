import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { ErrorState, LoadingSpinner } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
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

const ROLE_LABEL: Record<string, string> = {
  citizen: 'Cidadão',
  specialist: 'Especialista',
  admin: 'Moderação',
};

type Aba = 'relatados' | 'apoiados' | 'acoes';

const ABAS: { chave: Aba; rotulo: string }[] = [
  { chave: 'relatados', rotulo: 'Relatados' },
  { chave: 'apoiados', rotulo: 'Apoiados' },
  { chave: 'acoes', rotulo: 'Ações' },
];

export function PerfilScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = useAppSelector((state) => state.auth.user);
  const [aba, setAba] = useState<Aba>('relatados');

  const resumo = useResumo();
  const relatados = useRelatados();
  const apoiados = useApoiados();
  const acoes = useAcoes();
  useReleituraDoUsuario(user?.email_verified === false);

  if (!user || resumo.isLoading) return <LoadingSpinner />;
  if (resumo.isError || !resumo.data) {
    return <ErrorState message="Não foi possível carregar o seu perfil." />;
  }

  const abrirProblema = (id: number) => navigation.navigate('DetalheProblema', { id });
  const abrirAcao = (id: number) => navigation.navigate('MobilizacaoDetail', { id });

  const fotos = [...(relatados.data ?? []), ...(apoiados.data ?? [])]
    .map((problema) => problema.capa_url)
    .filter((url): url is string => Boolean(url));

  const papel = ROLE_LABEL[user.role] ?? user.role;
  const subtitulo = `${papel} · no Mutira desde ${membroDesde(resumo.data.membro_desde)}`;

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
            { valor: resumo.data.acoes, rotulo: 'ações' },
          ]}
        />

        <AvisoEmailNaoConfirmado usuario={user} />

        <FaixaAvisos
          avisos={resumo.data.avisos}
          onAbrirProblema={abrirProblema}
          onAbrirAcao={abrirAcao}
        />

        <View
          accessibilityRole="tablist"
          style={[styles.abas, { borderBottomColor: theme.colors.outline }]}
        >
          {ABAS.map(({ chave, rotulo }) => {
            const ativa = aba === chave;
            return (
              <Pressable
                key={chave}
                onPress={() => setAba(chave)}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativa }}
                style={[
                  styles.aba,
                  { borderBottomColor: ativa ? theme.colors.primary : 'transparent' },
                ]}
              >
                <Text
                  style={[
                    styles.abaTexto,
                    { color: ativa ? theme.colors.primary : theme.colors.onSurfaceVariant },
                  ]}
                >
                  {rotulo}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {aba === 'relatados' &&
          (relatados.isLoading ? (
            <LoadingSpinner />
          ) : (
            <GradeProblemas
              problemas={relatados.data ?? []}
              vazio="Você ainda não relatou nenhum problema."
              onAbrir={abrirProblema}
            />
          ))}
        {aba === 'apoiados' &&
          (apoiados.isLoading ? (
            <LoadingSpinner />
          ) : (
            <GradeProblemas
              problemas={apoiados.data ?? []}
              vazio="Você ainda não apoiou nenhum problema."
              onAbrir={abrirProblema}
            />
          ))}
        {aba === 'acoes' &&
          (acoes.isLoading ? (
            <LoadingSpinner />
          ) : (
            <ListaAcoes acoes={acoes.data ?? []} onAbrir={abrirAcao} />
          ))}

        <View
          style={[styles.menu, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}
        >
          {user.role === 'admin' && (
            <Pressable
              onPress={() => navigation.navigate('Moderacao')}
              accessibilityRole="button"
              style={styles.menuItem}
            >
              <MaterialCommunityIcons name="shield-account" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.menuTexto, { color: theme.colors.onSurface }]}>Moderação</Text>
            </Pressable>
          )}
          <Pressable onPress={encerrarSessao} accessibilityRole="button" style={styles.menuItem}>
            <MaterialCommunityIcons name="logout" size={20} color={theme.colors.onSurface} />
            <Text style={[styles.menuTexto, { color: theme.colors.onSurface }]}>Sair da conta</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ExcluirConta')}
            accessibilityRole="button"
            style={styles.menuItem}
          >
            <MaterialCommunityIcons name="account-remove" size={20} color={theme.colors.error} />
            <Text style={[styles.menuTexto, { color: theme.colors.error }]}>Excluir conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingBottom: spacing.four },
  abas: {
    flexDirection: 'row',
    marginTop: spacing.three,
    marginHorizontal: spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aba: { flex: 1, alignItems: 'center', paddingVertical: 9, borderBottomWidth: 2 },
  abaTexto: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  menu: {
    marginTop: spacing.three,
    marginHorizontal: spacing.two,
    borderRadius: 12,
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
    paddingVertical: spacing.two + 1,
    paddingHorizontal: spacing.three - 2,
  },
  menuTexto: { fontSize: typography.fontSize.base - 1 },
});
