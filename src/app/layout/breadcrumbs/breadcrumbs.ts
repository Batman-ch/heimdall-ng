import { Component, OnDestroy } from '@angular/core';
import { BreadcrumbsService, Crumb } from '../../core/services/breadcrumbs.service';
import { Subscription, startWith } from 'rxjs';

/**
 * Renderiza breadcrumbs leyendo el stream del servicio.
 * Mantiene el DOM simple (Inicio / Sección / Página).
 */
@Component({
  standalone: true,
  selector: 'app-breadcrumbs',
  imports: [],
  styles: [
    `.crumbs { color: var(--text-muted); font-size: 13px; display: flex; flex-wrap: wrap; gap: 6px; }`,
    `.crumbs .link { color: var(--text-normal); text-decoration: none; }`,
    `.crumbs .link:hover { text-decoration: underline; }`,
    `.crumbs .sep { color: var(--text-muted); }`
  ],
  template: `
    <div class="crumbs">
    @for (c of crumbs; track $index; let last = $last) {
      <a [href]="c.url" class="link">{{ c.label }}</a>
      @if (!last) {
        <span class="sep">></span>
      }
    }
  </div>
  `
})
export class BreadcrumbsComponent implements OnDestroy {
  crumbs: Crumb[] = [];
  private sub?: Subscription;

  constructor(private bc: BreadcrumbsService) {
    this.sub = this.bc.stream().pipe(startWith(this.bc.buildNow())).subscribe(c => this.crumbs = c);
  }
  ngOnDestroy() { this.sub?.unsubscribe(); }
}
