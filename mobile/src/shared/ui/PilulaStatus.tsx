import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import type { AppTheme } from '@shared/theme/theme';
import { texto } from '@shared/theme/typography';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

/** Papel semântico de um status. A cor sai do tema; o texto e o ícone dizem o estado. */
export type PapelStatus = 'atencao' | 'andamento' | 'sucesso' | 'erro' | 'neutro';

function coresDoPapel(theme: AppTheme, papel: PapelStatus) {
  switch (papel) {
    case 'atencao':
      return { fundo: theme.colors.secondaryContainer, texto: theme.colors.onSecondaryContainer };
    case 'andamento':
      return { fundo: theme.colors.primaryContainer, texto: theme.colors.onPrimaryContainer };
    case 'sucesso':
      return { fundo: theme.colors.success, texto: theme.colors.onSuccess };
    case 'erro':
      return { fundo: theme.colors.error, texto: theme.colors.onError };
    default:
      return { fundo: theme.colors.surfaceVariant, texto: theme.colors.onSurfaceVariant };
  }
}

interface PilulaStatusProps {
  rotulo: string;
  papel: PapelStatus;
  icone?: string;
}

export function PilulaStatus({ rotulo, papel, icone }: PilulaStatusProps) {
  const theme = useAppTheme();
  const cores = coresDoPapel(theme, papel);

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 99,
        backgroundColor: cores.fundo,
      }}
    >
      {icone && <MaterialCommunityIcons name={icone as Icone} size={14} color={cores.texto} />}
      <Text style={{ ...texto.rotulo, color: cores.texto }}>{rotulo}</Text>
    </View>
  );
}
