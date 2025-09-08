/**
 * Rutas de la sección IT
 * Se cargan lazy desde app.routes (mejor performance).
 * Cada entry usa loadComponent para componentes standalone.
 */
import { Routes } from '@angular/router';

export const IT_ROUTES: Routes = [
  {
    // Shell de la sección (navbar local, tabs, etc. si quisieras)
    path: '',
    loadComponent: () =>
      import('./pages/it-shell').then(c => c.ItShell),
    data: { title: 'IT' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/inventory').then(c => c.Inventory),
        data: { title: 'Inventario' }
      },
      // aquí más páginas: devices, maintenance, etc.
    ]
  }
];
