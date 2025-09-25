import { Component, ViewChild, signal, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
  @ViewChild('drawer') drawer?: MatSidenav;
  @ViewChild(MatSidenavContainer) container!: MatSidenavContainer; // 👈

  navItems = NAV_ITEMS;
  isMobile = signal(false);
  collapsed = signal<boolean>(this.readCollapsed());
  ready = false;

  constructor(private bp: BreakpointObserver, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
     queueMicrotask(() => {
        this.ready = true;
        this.cdr.detectChanges();
      })
    this.bp.observe('(max-width: 768px)').subscribe(res => {
      this.isMobile.set(res.matches);
      const d = this.drawer;
        if (!d) return; // 👈 guard clave

        this.isMobile.set(res.matches);
        if (res.matches) {
          this.collapsed.set(false);
          d.mode = 'over';
          d.close();
        } else {
          d.mode = 'side';
          d.open();
          queueMicrotask(() => this.container?.updateContentMargins());
        }
        this.cdr.detectChanges();
    });
  }
  // habilita la UI luego del primer render
 
  onToggleFromTopbar(): void {
    const d = this.drawer;
    if (!d) return;
    if (this.isMobile()) {
      d.toggle();
    } else {
      this.collapsed.update(v => {
        const next = !v;
        this.writeCollapsed(next);
        return next;
      });
      // 👇 fuerza recalcular márgenes luego del cambio de ancho
      queueMicrotask(() => this.container?.updateContentMargins());
    }
  }

  closeIfOver(d: MatSidenav): void { if (d.mode === 'over') d.close(); }
  onTopbar(evt: 'notifications'|'account') { /* abrir paneles */ }

  private readCollapsed(): boolean { try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; } }
  private writeCollapsed(v: boolean): void { try { localStorage.setItem(LS_KEY, v ? '1' : '0'); } catch {} }
}
