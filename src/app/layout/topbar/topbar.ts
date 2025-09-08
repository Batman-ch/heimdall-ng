import { Component, EventEmitter, Output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Topbar “tonto”: emite eventos (ej: toggle sidenav móvil, abrir menú usuario).
 * Perfecto para mantener AppShell liviano.
 */
@Component({
  standalone: true,
  selector: 'app-topbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
   templateUrl: './topbar.html',
  styleUrls: ['./topbar.scss']
})
export class TopbarComponent {
  /** Eventos simples para que el shell decida qué hacer. */
  @Output() notify = new EventEmitter<'notifications'|'account'>();
  @Output() toggle = new EventEmitter<void>();              // ✅ ahora existe
}
