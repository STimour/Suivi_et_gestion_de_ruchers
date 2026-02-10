import {
    Weight,
    Thermometer,
    Droplets,
    MapPin,
    Wind,
    Volume2,
    BatteryMedium,
    HelpCircle,
    type LucideIcon,
} from 'lucide-react';

interface CapteurTypeConfig {
    value: string;
    label: string;
    icon: LucideIcon;
}

export const TYPE_CAPTEUR_OPTIONS: CapteurTypeConfig[] = [
    { value: 'Poids', label: 'Poids', icon: Weight },
    { value: 'Temperature', label: 'Température', icon: Thermometer },
    { value: 'Humidite', label: 'Humidité', icon: Droplets },
    { value: 'GPS', label: 'GPS', icon: MapPin },
    { value: 'CO2', label: 'CO2', icon: Wind },
    { value: 'Son', label: 'Son', icon: Volume2 },
    { value: 'Batterie', label: 'Batterie', icon: BatteryMedium },
];

const TYPE_MAP = Object.fromEntries(
    TYPE_CAPTEUR_OPTIONS.map((opt) => [opt.value, opt])
);

export function getCapteurTypeLabel(value: string): string {
    return TYPE_MAP[value]?.label ?? value;
}

export function getCapteurTypeIcon(value: string): LucideIcon {
    return TYPE_MAP[value]?.icon ?? HelpCircle;
}
