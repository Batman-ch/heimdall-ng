import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
export const API_PREFIX   = new InjectionToken<string>('API_PREFIX'); // ej. /api/v1
