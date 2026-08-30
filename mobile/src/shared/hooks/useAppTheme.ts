import { useTheme as usePaperTheme } from 'react-native-paper';
import type { AppTheme } from '@shared/theme/theme';

export function useAppTheme(): AppTheme {
  return usePaperTheme<AppTheme>();
}
