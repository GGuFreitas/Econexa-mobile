import { Card as PaperCard } from 'react-native-paper';
import type { CardProps } from 'react-native-paper';
import type { ComponentType } from 'react';

const PaperCardTyped = PaperCard as ComponentType<CardProps>;

export function Card(props: CardProps) {
  return <PaperCardTyped {...props} />;
}

Card.Title = PaperCard.Title;
Card.Content = PaperCard.Content;
Card.Cover = PaperCard.Cover;
Card.Actions = PaperCard.Actions;
