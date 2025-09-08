import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export type Crumb = { label: string; url: string };

/**
 * Genera breadcrumbs leyendo la metadata de las rutas (data.title)
 * Buenas prácticas:
 * - cada página de features define data: { title: '...' }
 * - título corto, orientado a usuario
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbsService {
  constructor(private router: Router, private route: ActivatedRoute) {}

  stream(): Observable<Crumb[]> {
    return this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this._build(this.route.root))
    );
  }

  private _build(route: ActivatedRoute, url: string = '', crumbs: Crumb[] = []): Crumb[] {
    const children = route.children;
    if (!children || children.length === 0) return crumbs;

    for (const child of children) {
      const routeURL = child.snapshot.url.map(s => s.path).join('/');
      if (routeURL) url += `/${routeURL}`;

      const title = child.snapshot.data['title'];
      if (title) crumbs.push({ label: title, url });

      return this._build(child, url, crumbs); // bajar por el árbol
    }
    return crumbs;
  }
}
