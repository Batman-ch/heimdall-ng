/**
 * Definición de la navegación lateral (sidebar).
 * Mantener la UI desacoplada de esta config permite:
 * - cambiar labels/paths sin tocar componentes
 * - internacionalización futura
 * - control por permisos (filtrar items antes de renderizar)
 */
export interface NavItem {
  label: string;            // Texto visible
  icon?: string;            // Nombre del mat-icon
  path?: string;            // Ruta absoluta o relativa
  children?: NavItem[];     // Submenú (si aplica)
  key : string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', icon: 'home', path: '/',  key: '1' },
  {
    label: 'Contenedores', icon: 'dashboard',  key: 'Contenedores-dashboard',
    children: [
      { label: 'IT',       icon: 'settings',          path: '/it', key: 'it-root',
        children : [
          { label: 'Devices',  icon: 'inventory_2',   path: '/it' , key: 'it-inventory'},
          { label: 'Devices',  icon: 'devices',   path: '/it/devices' , key: 'it-devices'},
        ]
      },
      { label: 'Finanzas', icon: 'account_balance',   path: '/finance' , key: 'finance-dashboard',
        children: [
          { label: 'Pagos John Deere', icon: 'receipt_long', path: '/finance/john-deere', key: 'finance-john-deere' },
          { label: 'Facturas John Deere', icon: 'description', path: '/finance/invoices', key: 'finance-john-deere-invoices' }
        ]
      },
      
    ]
  }
];
