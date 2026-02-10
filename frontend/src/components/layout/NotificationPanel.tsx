'use client';

import { Bell, Check, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, type NotificationData } from '@/hooks/useNotifications';
import { NOTIFICATION_TYPE_CONFIG } from '@/lib/constants/notification.constants';

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR');
}

function NotificationItem({
  notification,
  onRead,
  onDelete,
  onNavigate,
}: {
  notification: NotificationData;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (rucheId: string) => void;
}) {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.Equipe;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.lue) {
      onRead(notification.id);
    }
    if (notification.ruche_id) {
      onNavigate(notification.ruche_id);
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
        !notification.lue ? 'bg-amber-50/50' : ''
      }`}
      onClick={handleClick}
    >
      <div className={`mt-0.5 rounded-full p-1.5 ${config.bgClass}`}>
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {notification.titre}
          </p>
          {!notification.lue && (
            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatRelativeDate(notification.date)}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="mt-0.5 p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function NotificationPanel() {
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } =
    useNotifications();

  const handleNavigate = (rucheId: string) => {
    router.push(`/dashboard/hives/${rucheId}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-amber-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-white" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 transition-colors"
            >
              <Check className="h-3 w-3" />
              Tout marquer comme lu
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onRead={markRead}
                onDelete={deleteNotification}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
