import Svg, { Circle, Path } from 'react-native-svg';

type LogoMutiraProps = {
  tamanho?: number;
  cor: string;
};

export function LogoMutira({ tamanho = 40, cor }: LogoMutiraProps) {
  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 40 40"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel="Logo do Mutira"
    >
      <Path
        d="M20 37s-12-11-12-20.5a12 12 0 0 1 24 0C32 26 20 37 20 37z"
        stroke={cor}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <Circle cx={20} cy={16.5} r={6.5} stroke={cor} strokeWidth={1.3} strokeDasharray="2 2.2" />
      <Circle cx={20} cy={16.5} r={2.4} fill={cor} />
      <Circle cx={20} cy={10} r={2} fill={cor} />
      <Circle cx={14.4} cy={19.8} r={2} fill={cor} />
      <Circle cx={25.6} cy={19.8} r={2} fill={cor} />
    </Svg>
  );
}
