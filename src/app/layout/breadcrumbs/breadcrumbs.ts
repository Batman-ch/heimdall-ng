import { Component, OnDestroy } from '@angular/core';
import { BreadcrumbsService, Crumb } from '../../core/services/breadcrumbs.service';
import { Subscription } from 'rxjs';

/**
 * Renderiza breadcrumbs leyendo el stream del servicio.
 * Mantiene el DOM simple (Inicio / Sección / Página).
 */
@Component({
  standalone: true,
  selector: 'app-breadcrumbs',
  imports: [],
  styles: [`.crumbs { color: var(--m365-muted); font-size: 13px; }`],
  template: `
    <div class="crumbs">
    @for (c of crumbs; track $index; let last = $last) {
      <a [href]="c.url" class="link">{{ c.label }}</a>
      @if (!last) {
        <span> / </span>
      }
    }
  </div>
  `
})
export class BreadcrumbsComponent implements OnDestroy {
  crumbs: Crumb[] = [];
  private sub?: Subscription;

  constructor(private bc: BreadcrumbsService) {
    this.sub = this.bc.stream().subscribe(c => this.crumbs = c);
  }
  ngOnDestroy() { this.sub?.unsubscribe(); }
}
