import {  Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavItem } from '../../core/config/nav.config';

/**
 * Sidebar “tonto”: solo recibe items y los dibuja.
 * No conoce permisos, no conoce rutas: eso viene desde config/servicios.
 */
@Component({
  standalone: true,
  selector: 'app-side-nav',
  imports: [MatListModule, MatIconModule,MatTooltipModule, RouterLink, RouterLinkActive,CommonModule],
  templateUrl: './side-nav.html',
  styleUrls: ['./side-nav.scss']
})
export class SideNavComponent {
  /** Items a renderizar (inyectados desde AppShell a partir de NAV_ITEMS). */
  @Input() items: NavItem[] = [];
  
  /** true = mini-rail (solo iconos) */
  @Input() collapsed = false;

  /** Pide al contenedor que abra/cierre el drawer (hamburger/close). */
  @Output() toggle = new EventEmitter<void>();

  /**
   * Notifica que el usuario hizo click en un link de navegación.
   * El contenedor puede cerrar el sidenav si está en modo "over" (mobile).
   */
  @Output() navigate = new EventEmitter<void>();

  onNavigate() {
    this.navigate.emit();
  }
}
