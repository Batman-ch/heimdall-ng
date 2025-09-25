import { 
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
  APP_INITIALIZER,
} from '@angular/core';

import { 
  provideRouter,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';

import {
  provideHttpClient,
  withInterceptorsFromDi,
  withInterceptors
} from '@angular/common/http';

import { MsalModule, MsalGuard, MsalService, MsalInterceptor, MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG } from '@azure/msal-angular';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';

import { MSALInstanceFactory, MSALGuardConfigFactory, MSALInterceptorConfigFactory } from './auth-config';
import { apiPrefixInterceptor } from './core/interceptors/api-prefix.interceptor';
import { API_BASE_URL, API_PREFIX } from './core/tokens/api-base-url.token';
import { environment } from '../environments/environment';

function initMsalFactory(msal: MsalService) {
  // Debe devolver una función que retorne una Promise
  return () => msal.instance.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes,withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptorsFromDi(),withInterceptors([apiPrefixInterceptor])),

    importProvidersFrom(MsalModule.forRoot(
      MSALInstanceFactory(),
      MSALGuardConfigFactory(),
      MSALInterceptorConfigFactory(),
    )),
    // Inyectamos valores de environment
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: API_PREFIX,   useValue: environment.apiPrefix },

    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },

    MsalGuard,

    // 👇 Espera a que MSAL inicialice ANTES de que arranque la app
    { provide: APP_INITIALIZER, useFactory: initMsalFactory, deps: [MsalService], multi: true },
  ]
};
