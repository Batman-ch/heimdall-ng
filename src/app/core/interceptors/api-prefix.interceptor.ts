import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL, API_PREFIX } from '../tokens/api-base-url.token';

/**
 * Interceptor que antepone {baseUrl}{prefix} a URLs relativas.
 * Reglas:
 * - No modifica URLs absolutas (http/https)
 * - No modifica data:, blob:, mailto:, etc.
 * - Evita dobles barras
 * - Se puede omitir con header 'X-Skip-BaseUrl: true'
 */
export const apiPrefixInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const prefix  = inject(API_PREFIX);

  // Permitir saltar el prefijo si el request lo pide
  if (req.headers.has('X-Skip-BaseUrl')) {
    const headers = req.headers.delete('X-Skip-BaseUrl');
    return next(req.clone({ headers }));
  }

  const url = req.url ?? '';

  const isAbsolute =
    /^https?:\/\//i.test(url) ||
    /^(data|blob|mailto|tel):/i.test(url);

  if (isAbsolute) {
    return next(req);
  }

  // Normalizar barras
  const join = (...parts: string[]) =>
    parts
      .filter(Boolean)
      .map((p, i) => (i === 0 ? p.replace(/\/+$/,'') : p.replace(/^\/+|\/+$/g,'')))
      .join('/');

  const newUrl = join(baseUrl, prefix, url);

  return next(req.clone({ url: newUrl }));
};
