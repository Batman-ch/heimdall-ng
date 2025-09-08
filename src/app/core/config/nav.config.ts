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
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', icon: 'home', path: '/' },
  {
    label: 'Contenedores', icon: 'dashboard',
    children: [
      { label: 'IT',       icon: 'settings',          path: '/it' },
      { label: 'Finanzas', icon: 'account_balance',   path: '/finance' },
    ]
  }
];
