import { Alert } from 'react-native';
import { Button } from '@shared/ui/Button';
import { useEntrarComGoogle } from '../hooks/useEntrarComGoogle';
import { loginComGoogleDisponivel } from '../helpers/googleSignIn';
import { explicacaoDoAviso, mensagemDeErroDoGoogle, type AvisoDoGoogle } from '../utils/google';

const GOOGLE_DISPONIVEL = loginComGoogleDisponivel();

type BotaoGoogleProps = {
  onEntrou: () => void;
  onFalha: (mensagem: string | null) => void;
};

export function BotaoGoogle({ onEntrou, onFalha }: BotaoGoogleProps) {
  const entrarComGoogle = useEntrarComGoogle();

  if (!GOOGLE_DISPONIVEL) return null;

  const handleEntrar = async () => {
    onFalha(null);
    try {
      const resultado = await entrarComGoogle.mutateAsync();
      if (resultado.cancelado) return;
      explicarAviso(resultado.aviso);
      onEntrou();
    } catch (erro) {
      onFalha(mensagemDeErroDoGoogle(erro));
    }
  };

  return (
    <Button
      mode="outlined"
      icon="google"
      onPress={handleEntrar}
      loading={entrarComGoogle.isPending}
      disabled={entrarComGoogle.isPending}
    >
      Entrar com Google
    </Button>
  );
}

function explicarAviso(aviso: AvisoDoGoogle | null) {
  const explicacao = explicacaoDoAviso(aviso);
  if (!explicacao) return;
  Alert.alert(explicacao.titulo, explicacao.texto);
}
