import type { ConfigContext, ExpoConfig } from 'expo/config';

// Identidade do app. Trocar o nome é só mudar aqui.
// ATENÇÃO: `id` vira o applicationId do Android e o bundleIdentifier do iOS. Depois do
// primeiro envio à Play Store ele NÃO pode mais mudar, e os clients OAuth do Google e a
// restrição da chave do Maps são cadastrados com ele.
const IDENTIDADE = {
  nome: 'Mutira',
  slug: 'econexa-mobile',
  id: 'br.com.mutira',
  scheme: 'mutira',
};

const COR_FUNDO = '#134E4A';

// O resto vem das variáveis de ambiente do EAS (`eas env:create`), nunca do repositório.
// GOOGLE_MAPS_ANDROID_API_KEY: chave da "Maps SDK for Android", restrita ao `id` acima +
// SHA-1 do EAS e da Play. Sem ela o mapa fica em branco no build nativo do Android.
function exigirVariaveisDeProducao() {
  if (process.env.EAS_BUILD_PROFILE !== 'production') return;

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const faltando = [
    !apiUrl && 'EXPO_PUBLIC_API_URL',
    !process.env.GOOGLE_MAPS_ANDROID_API_KEY && 'GOOGLE_MAPS_ANDROID_API_KEY',
  ].filter(Boolean);

  if (faltando.length > 0) {
    throw new Error(`Build de produção sem: ${faltando.join(', ')}. Cadastre com "eas env:create --environment production".`);
  }
  if (!apiUrl!.startsWith('https://')) {
    throw new Error(`EXPO_PUBLIC_API_URL precisa ser HTTPS em produção (recebido: ${apiUrl}).`);
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  exigirVariaveisDeProducao();
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

  return {
    ...(config as ExpoConfig),
    name: IDENTIDADE.nome,
    slug: IDENTIDADE.slug,
    scheme: IDENTIDADE.scheme,
    ios: {
      ...config.ios,
      bundleIdentifier: IDENTIDADE.id,
    },
    android: {
      ...config.android,
      package: IDENTIDADE.id,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: COR_FUNDO,
      },
      ...(mapsKey ? { config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } } } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 160,
          resizeMode: 'contain',
          backgroundColor: COR_FUNDO,
        },
      ],
    ],
  };
};
