import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/finance-shell').then(c => c.FinanceShell),
    data: { title: 'Finanzas' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/billing').then(c => c.Billing),
        data: { title: 'Facturas y pagos' }
      }
    ]
  }
];
