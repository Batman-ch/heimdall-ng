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
      },
      {
        path: 'john-deere',
        loadComponent: () =>
          import('./pages/john-deere-payments/john-deere-payments').then(c => c.JohnDeerePaymentsComponent),
        data: { title: 'Pagos John Deere' }
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./pages/john-deere-invoices/john-deere-invoices').then(c => c.JohnDeereInvoicesComponent),
        data: { title: 'Facturas John Deere' }
      }
    ]
  }
];
