import { Component, EventEmitter, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';


// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';


import { MsalService } from '@azure/msal-angular';
import { LOGIN_REQUEST } from '../../auth-config';

type Notification = { id: string; title: string; time: string; read?: boolean };

// 👇 definí un type para reusar
export type TopbarEvent = 'notifications' | 'account';

/**
 * Topbar “tonto”: emite eventos (ej: toggle sidenav móvil, abrir menú usuario).
 * Perfecto para mantener AppShell liviano.
 */
@Component({
  standalone: true,
  selector: 'app-topbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule,CommonModule,MatMenuModule, MatBadgeModule, MatDividerModule,
    MatListModule, MatTooltipModule,
],
  styleUrls: ['./topbar.scss'],
  templateUrl: './topbar.html',
})
export class TopbarComponent {
  private msal = inject(MsalService);
  @Output() toggle = new EventEmitter<void>();
  // ⬇️ antes: new EventEmitter<string>()
  @Output() notify = new EventEmitter<TopbarEvent>();

  account = computed(() => this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0]);
  displayName = computed(() => this.account()?.name ?? 'Usuario');
  email = computed(() => this.account()?.username ?? '');
  initials = computed(() => {
    const n = this.displayName();
    return n.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
  });

  // --- Estado login
  isLoggedIn = computed(() => !!this.account());
  notifications = signal<Notification[]>([
    { id: 'n1', title: 'Hay 3 dispositivos pendientes de revisión', time: 'hace 2 min' },
    { id: 'n2', title: 'Backup diario finalizado OK', time: 'hace 15 min' },
    { id: 'n3', title: 'Nuevo alta de usuario: jdoe', time: 'hace 1 h' },
    { id: 'n4', title: 'Actualización disponible: Pingacho 1.3', time: 'hace 3 h' },
    { id: 'n5', title: 'VPN Forti: intento fallido', time: 'ayer' },
  ]);
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  // --- Acciones
  login() {
    this.msal.loginRedirect({
      ...LOGIN_REQUEST,
      prompt: 'select_account'
    });
  }
  logout() { this.msal.logoutRedirect(); }
  /** Eventos simples para que el shell decida qué hacer. */
  /*@Output() notify = new EventEmitter<'notifications'|'account'>();
  @Output() toggle = new EventEmitter<void>();              // ✅ ahora existe*/
  markAllRead() {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }
}
