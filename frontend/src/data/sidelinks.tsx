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
} from '@tabler/icons-react'
import { Routes } from '@/utilities/routes'

export interface NavLink {
  title: string
  label?: string
  href: string
  icon: JSX.Element
  requiredRole?: string
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
  },
  {
    title: 'Templates',
    label: '',
    href: Routes.TEMPLATES,
    icon: <IconLayout size={18} />,
  },
  {
    title: 'Screens',
    label: '',
    href: Routes.SCREENS,
    icon: <IconDeviceTv size={18} />,
  },
  {
    title: 'Analytics',
    label: '',
    href: Routes.ANALYTICS,
    icon: <IconChartBar size={18} />,
  },
  {
    title: 'Collaboration',
    label: '',
    href: Routes.COLLABORATION,
    icon: <IconUsers size={18} />,
  },
  {
    title: 'Users',
    label: '',
    href: Routes.USERS,
    icon: <IconUserCircle size={18} />,
  },
  {
    title: 'Recycle Bin',
    label: '',
    href: Routes.RECYCLE_BIN,
    icon: <IconTrash size={18} />,
  },
  {
    title: 'Organizations',
    label: '',
    href: Routes.ADMIN_COMPANIES,
    icon: <IconBuildingCommunity size={18} />,
    requiredRole: 'super_admin'
  },
  {
    title: 'Chat',
    label: '',
    href: '#chat',
    icon: <IconMessage size={18} />,
  },
]
