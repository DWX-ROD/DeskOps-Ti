/**
 * @file auth.ts
 * @description Autenticação Google Workspace via Firebase Auth com suporte a OAuth Access Token em memória.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicializa Firebase apenas uma vez
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provedor Google com os escopos autorizados para Google Sheets, Drive e Forms
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache do Access Token exclusivamente em memória (NÃO armazenar em localStorage por segurança)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Inicializa o listener de estado de autenticação
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Se já está logado mas perdeu token em memória, precisará de re-autenticação rápida
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Realiza o login com o Google via Popup e obtém o OAuth Access Token para Google Sheets
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    // Trata fechamento normal ou cancelamento do popup pelo usuário sem disparar erro no console
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      return null;
    }

    if (error?.code === 'auth/popup-blocked') {
      throw new Error(
        'A janela pop-up do Google foi bloqueada pelo navegador. Permita pop-ups para esta página nas configurações do navegador e tente novamente.'
      );
    }

    console.error('Erro na autenticação com Google:', error?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retorna o Access Token em memória para chamadas de API
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Define manualmente o token em memória (caso obtido no login)
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Desconecta o usuário e limpa o token em memória
 */
export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
