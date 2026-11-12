import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { FalhaDoGoogle, podeOferecerGoogle } from '../utils/google';

export type ModuloGoogle = typeof import('@react-native-google-signin/google-signin');
type RespostaDoSeletor = Awaited<ReturnType<ModuloGoogle['GoogleSignin']['signIn']>>;

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined;

export function loginComGoogleDisponivel(): boolean {
  return podeOferecerGoogle({
    webClientId: WEB_CLIENT_ID,
    plataforma: Platform.OS,
    noExpoGo: isRunningInExpoGo(),
  });
}

export function carregarModuloDoGoogle(): ModuloGoogle | null {
  try {
    return require('@react-native-google-signin/google-signin') as ModuloGoogle;
  } catch {
    return null;
  }
}

export async function obterIdTokenDoGoogle(
  carregar: () => ModuloGoogle | null = carregarModuloDoGoogle,
  webClientId: string | undefined = WEB_CLIENT_ID,
): Promise<string | null> {
  const modulo = carregar();
  if (!modulo || !webClientId) throw new FalhaDoGoogle('indisponivel');
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = modulo;

  let resposta: RespostaDoSeletor;
  try {
    GoogleSignin.configure({ webClientId });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    resposta = await GoogleSignin.signIn();
  } catch (erro) {
    if (isErrorWithCode(erro) && erro.code === statusCodes.SIGN_IN_CANCELLED) return null;
    if (isErrorWithCode(erro) && erro.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new FalhaDoGoogle('semPlayServices');
    }
    if (isErrorWithCode(erro) && erro.code === statusCodes.IN_PROGRESS) {
      throw new FalhaDoGoogle('emAndamento');
    }
    console.warn('Falha no login com Google.', erro);
    throw new FalhaDoGoogle('desconhecido');
  }

  if (!isSuccessResponse(resposta)) return null;
  await GoogleSignin.signOut().catch(() => undefined);
  if (!resposta.data.idToken) throw new FalhaDoGoogle('semIdToken');
  return resposta.data.idToken;
}
