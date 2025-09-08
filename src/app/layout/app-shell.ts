import { Component, ViewChild, signal, AfterViewInit } from '@angular/core';
import { MatSidenav, MatSidenavModule, MatSidenavContainer } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterOutlet } from '@angular/router';
import { NAV_ITEMS } from '../core/config/nav.config';
import { SideNavComponent } from './side-nav/side-nav';
import { TopbarComponent } from './topbar/topbar';
import { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs';

const LS_KEY = 'sidenavCollapsed';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [MatSidenavModule, RouterOutlet, SideNavComponent, TopbarComponent, BreadcrumbsComponent],
  templateUrl: './app-shell.html',
  styleUrls: ['./app-shell.scss']
})
export class AppShellComponent implements AfterViewInit {
  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild(MatSidenavContainer) container!: MatSidenavContainer; // 👈

  navItems = NAV_ITEMS;
  isMobile = signal(false);
  collapsed = signal<boolean>(this.readCollapsed());

  constructor(private bp: BreakpointObserver) {}

  ngAfterViewInit(): void {
    this.bp.observe('(max-width: 768px)').subscribe(res => {
      this.isMobile.set(res.matches);
      if (res.matches) {
        this.collapsed.set(false);      // nunca mini-rail en mobile
        this.drawer.mode = 'over';
        this.drawer.close();
      } else {
        this.drawer.mode = 'side';
        this.drawer.open();
        // por si venimos de mobile, re-medir
        queueMicrotask(() => this.container.updateContentMargins());
      }
    });
  }

  onToggleFromTopbar(): void {
    if (this.isMobile()) {
      this.drawer.toggle();
    } else {
      this.collapsed.update(v => {
        const next = !v;
        this.writeCollapsed(next);
        return next;
      });
      // 👇 fuerza recalcular márgenes luego del cambio de ancho
      queueMicrotask(() => this.container.updateContentMargins());
    }
  }

  closeIfOver(d: MatSidenav): void { if (d.mode === 'over') d.close(); }
  onTopbar(evt: 'notifications'|'account') { /* abrir paneles */ }

  private readCollapsed(): boolean { try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; } }
  private writeCollapsed(v: boolean): void { try { localStorage.setItem(LS_KEY, v ? '1' : '0'); } catch {} }
}
