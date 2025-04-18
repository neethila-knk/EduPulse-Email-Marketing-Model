// src/types/index.ts

export interface Campaign {
  id: string;
  name: string;
  emailCount: number;
  status: 'pending' | 'ongoing' | 'completed' | 'canceled' | "sent";

  campaignName: string;
  clusterName?: string;
  createdAt?: string;
  sentAt?: string;
}

export interface StatCardProps {
  title?: string;
  count?: number;
  label?: string;
  value?: string | number;
  description?: string | React.ReactNode;
  icon?: React.ReactNode;
  iconColor?: string;
  loading?: boolean;
  content?: React.ReactNode; // Add this new property
}

export interface StatusBadgeProps {
  status: Campaign['status'];
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'pending' | 'cancel' | 'danger' | 'password' | 'block' | 'campaigncancel';
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