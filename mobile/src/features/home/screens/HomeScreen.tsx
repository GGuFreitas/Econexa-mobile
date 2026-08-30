import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { ProblemMap } from '@features/problemas/map/ProblemMap';
import type { RootStackParamList } from '@navigation/AppNavigator';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <ProblemMap
      onRelatar={() => navigation.navigate('CriarProblema')}
      onVerDetalhes={(id) => navigation.navigate('DetalheProblema', { id })}
    />
  );
}
