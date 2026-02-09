import {
    Eye,
    Droplets,
    ShieldAlert,
    Grape,
    GitBranch,
    ArrowUpFromLine,
    Stethoscope,
    type LucideIcon,
    HelpCircle,
} from 'lucide-react';

interface InterventionTypeConfig {
    label: string;
    badgeClass: string;
    bgClass: string;
    textClass: string;
    icon: LucideIcon;
}

export const INTERVENTION_TYPE_CONFIG: Record<string, InterventionTypeConfig> = {
    Visite: {
        label: 'Visite',
        badgeClass: 'bg-blue-100 text-blue-800',
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-700',
        icon: Eye,
    },
    Nourrissement: {
        label: 'Nourrissement',
        badgeClass: 'bg-amber-100 text-amber-800',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        icon: Droplets,
    },
    Traitement: {
        label: 'Traitement',
        badgeClass: 'bg-red-100 text-red-800',
        bgClass: 'bg-red-50',
        textClass: 'text-red-700',
        icon: ShieldAlert,
    },
    Recolte: {
        label: 'Récolte',
        badgeClass: 'bg-green-100 text-green-800',
        bgClass: 'bg-green-50',
        textClass: 'text-green-700',
        icon: Grape,
    },
    Division: {
        label: 'Division',
        badgeClass: 'bg-violet-100 text-violet-800',
        bgClass: 'bg-violet-50',
        textClass: 'text-violet-700',
        icon: GitBranch,
    },
    PoseHausse: {
        label: 'Pose Hausse',
        badgeClass: 'bg-indigo-100 text-indigo-800',
        bgClass: 'bg-indigo-50',
        textClass: 'text-indigo-700',
        icon: ArrowUpFromLine,
    },
    ControleSanitaire: {
        label: 'Contrôle Sanitaire',
        badgeClass: 'bg-orange-100 text-orange-800',
        bgClass: 'bg-orange-50',
        textClass: 'text-orange-700',
        icon: Stethoscope,
    },
};

const FALLBACK_CONFIG: InterventionTypeConfig = {
    label: 'Autre',
    badgeClass: 'bg-gray-100 text-gray-800',
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-700',
    icon: HelpCircle,
};

export function getInterventionTypeStyle(type: string): InterventionTypeConfig {
    return INTERVENTION_TYPE_CONFIG[type] || FALLBACK_CONFIG;
}
