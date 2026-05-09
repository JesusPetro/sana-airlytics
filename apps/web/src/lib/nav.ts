import { LayoutDashboard, Map as MapIcon, Cpu, Bell, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  badge?: 'alertCount';
  bottomSection?: boolean;
  minRole?: 'editor' | 'admin';
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    labelKey: 'nav.dashboard',
  },
  {
    id: 'mapa',
    href: '/mapa',
    icon: MapIcon,
    labelKey: 'nav.map',
  },
  {
    id: 'dispositivos',
    href: '/dispositivos',
    icon: Cpu,
    labelKey: 'nav.devices',
  },
  {
    id: 'alertas',
    href: '/alertas',
    icon: Bell,
    labelKey: 'nav.alerts',
    badge: 'alertCount',
  },
  {
    id: 'settings',
    href: '/settings',
    icon: Settings,
    labelKey: 'nav.settings',
    bottomSection: true,
    minRole: 'admin',
  },
];
