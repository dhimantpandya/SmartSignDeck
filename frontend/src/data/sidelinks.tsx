import {
  IconLayoutDashboard,
  IconUserCircle,
  IconLayout,
  IconDeviceTv,
  IconChartBar,
  IconBuildingCommunity,
  IconMessage,
  IconUsers,
  IconTrash,
  IconPlaylist,
} from '@tabler/icons-react'
import { Routes } from '@/utilities/routes'

export interface NavLink {
  title: string
  label?: string
  href: string
  icon: JSX.Element
  requiredRoles?: string[]
}

export interface SideLink extends NavLink {
  sub?: NavLink[]
}

export const sidelinks: SideLink[] = [
  {
    title: 'Dashboard',
    label: '',
    href: Routes.DASHBOARD,
    icon: <IconLayoutDashboard size={18} />,
    requiredRoles: ['user', 'admin', 'super_admin', 'advertiser'],
  },
  {
    title: 'Templates',
    label: '',
    href: Routes.TEMPLATES,
    icon: <IconLayout size={18} />,
    requiredRoles: ['user', 'admin', 'super_admin'],
  },
  {
    title: 'Screens',
    label: '',
    href: Routes.SCREENS,
    icon: <IconDeviceTv size={18} />,
    requiredRoles: ['user', 'admin', 'super_admin', 'advertiser'],
  },
  {
    title: 'Playlists',
    label: '',
    href: Routes.PLAYLISTS,
    icon: <IconPlaylist size={18} />,
    requiredRoles: ['user', 'admin', 'super_admin'],
  },
  {
    title: 'Analytics',
    label: '',
    href: Routes.ANALYTICS,
    icon: <IconChartBar size={18} />,
    requiredRoles: ['user', 'admin', 'super_admin', 'advertiser'],
  },
  {
    title: 'Collaboration',
    label: '',
    href: Routes.COLLABORATION,
    icon: <IconUsers size={18} />,
    requiredRoles: ['user', 'admin', 'super_admin'],
  },
  {
    title: 'Users',
    label: '',
    href: Routes.USERS,
    icon: <IconUserCircle size={18} />,
    requiredRoles: ['user', 'admin', 'super_admin'],
  },
  {
    title: 'Recycle Bin',
    label: '',
    href: Routes.RECYCLE_BIN,
    icon: <IconTrash size={18} />,
    requiredRoles: ['user', 'admin', 'super_admin'],
  },
  {
    title: 'Requests',
    label: '',
    href: Routes.ADMIN_REQUESTS,
    icon: <IconMessage size={18} />,
    requiredRoles: ['super_admin'],
  },
  {
    title: 'Organizations',
    label: '',
    href: Routes.ADMIN_COMPANIES,
    icon: <IconBuildingCommunity size={18} />,
    requiredRoles: ['super_admin']
  },
  {
    title: 'Chat',
    label: '',
    href: '#chat',
    icon: <IconMessage size={18} />,
    requiredRoles: ['user', 'admin', 'super_admin'],
  },
]
