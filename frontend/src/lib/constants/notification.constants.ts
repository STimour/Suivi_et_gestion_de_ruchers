import { Clock, Users, Calendar, AlertTriangle, type LucideIcon } from 'lucide-react';

export interface NotificationTypeConfig {
  label: string;
  icon: LucideIcon;
  bgClass: string;
  textClass: string;
  iconColor: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  RappelVisite: {
    label: 'Rappel visite',
    icon: Clock,
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    iconColor: 'text-blue-500',
  },
  RappelTraitement: {
    label: 'Rappel traitement',
    icon: Clock,
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    iconColor: 'text-orange-500',
  },
  Equipe: {
    label: 'Equipe',
    icon: Users,
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
    iconColor: 'text-green-500',
  },
  Saisonnier: {
    label: 'Saisonnier',
    icon: Calendar,
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    iconColor: 'text-amber-500',
  },
  AlerteSanitaire: {
    label: 'Alerte sanitaire',
    icon: AlertTriangle,
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    iconColor: 'text-red-500',
  },
};
