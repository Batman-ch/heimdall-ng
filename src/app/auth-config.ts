import { IPublicClientApplication, PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
import { environment } from '../environments/environment';

const TENANT_ID = '95270d0a-00e0-4c85-87f0-eafd1eb0b806';
const SPA_CLIENT_ID = 'c6213e0d-3e79-4935-90d9-9cb6ab4de2e2';
const API_CLIENT_ID = '09496fd4-79fb-4cdc-b5a3-7d56081de7e6';          // de la app API
const API_URI = environment.apiBaseUrl; // debe coincidir con el host del API para adjuntar el token
const APP_URL = environment.appUrl;

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: SPA_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${TENANT_ID}`,
      redirectUri: APP_URL,
      postLogoutRedirectUri: APP_URL,
    },
    cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false },
  });
}

//protectedResourceMap → para que el interceptor proteja tu API.
export const protectedResourceMap = new Map<string, Array<string>>([
  [API_URI, [`api://${API_CLIENT_ID}/access_as_user`]],
]);

//LOGIN_REQUEST → para pedir el mismo scope en el login manual.
export const LOGIN_REQUEST = {
  scopes: [`api://${API_CLIENT_ID}/access_as_user`],
};

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
      interactionType: InteractionType.Redirect,
    authRequest: { scopes: [`api://${API_CLIENT_ID}/access_as_user`] },
  } as MsalGuardConfiguration;
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  return { interactionType: InteractionType.Redirect, protectedResourceMap };
}
