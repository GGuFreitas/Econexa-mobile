import { Avatar as PaperAvatar } from 'react-native-paper';
import type { ComponentProps } from 'react';

type AvatarImageProps = ComponentProps<typeof PaperAvatar.Image>;

export function Avatar(props: AvatarImageProps) {
  return <PaperAvatar.Image {...props} />;
}
