import { Modal as PaperModal } from 'react-native-paper';
import type { ModalProps } from 'react-native-paper';

export function Modal(props: ModalProps) {
  return <PaperModal {...props} />;
}
