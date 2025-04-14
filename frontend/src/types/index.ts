// src/types/index.ts

export interface Campaign {
  id: string;
  name: string;
  emailCount: number;
  status: 'pending' | 'ongoing' | 'completed' | 'canceled';
}

export interface StatCardProps {
  label?: string;
  value?: string;
  title?: string;
  count?: number;
  description?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  loading?: boolean; // Added loading property
}

export interface StatusBadgeProps {
  status: Campaign['status'];
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'pending' | 'cancel' | 'danger' | 'password' | 'block';
  size?: 'xsm' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export interface SidebarItemProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  href: string;
  children?: SidebarItemProps[];
  collapsed?: boolean;
}