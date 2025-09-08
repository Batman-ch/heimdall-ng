import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell';

export const routes: Routes = [
  {
    // AppShell arma layout: sidenav + topbar + breadcrumbs
    path: '',
    component: AppShellComponent,
    children: [
      {
        // Home del portal
        path: '',
        loadComponent: () =>
          import('./features/home/home').then(c => c.Home),
        data: { title: 'Inicio' }
      },
      {
        // Lazy load de IT
        path: 'it',
        loadChildren: () =>
          import('./features/it/it.routes').then(m => m.IT_ROUTES),
        data: { title: 'IT' }
      },
      {
        // Lazy load de Finanzas
        path: 'finance',
        loadChildren: () =>
          import('./features/finance/finance.routes').then(m => m.FINANCE_ROUTES),
        data: { title: 'Finanzas' }
      },
      { path: '**', redirectTo: '' }
    ]
  }
];
