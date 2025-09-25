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
      {
        path: 'devices',
        loadComponent: () =>
          import('./pages/devices/devices').then(c => c.devices),
        data: { title: 'Devices' }
      },
      {
        path: 'devices/:id',
        loadComponent: () =>
          import('./pages/devices/device-detail/device-detail').then(c => c.DeviceDetailComponent),
        data: { title: 'Detalle dispositivo' }
      },
      // aquí más páginas: devices, maintenance, etc.
    ]
  }
];
