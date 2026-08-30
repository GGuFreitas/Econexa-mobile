import { Chip as PaperChip } from 'react-native-paper';
import type { ChipProps } from 'react-native-paper';

export function Chip(props: ChipProps) {
  return <PaperChip mode="flat" {...props} />;
}
