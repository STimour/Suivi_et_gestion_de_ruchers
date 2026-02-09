import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATION_COUNT,
} from '@/lib/graphql/queries/notification.queries';
import {
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  DELETE_NOTIFICATION,
} from '@/lib/graphql/mutations/notification.mutations';

export interface NotificationData {
  id: string;
  type: string;
  titre: string;
  message: string;
  lue: boolean;
  date: string;
  ruche_id: string | null;
  intervention_id: string | null;
  ruche: {
    id: string;
    immatriculation: string;
  } | null;
}

interface GetNotificationsData {
  notifications: NotificationData[];
}

interface GetUnreadCountData {
  notifications_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export function useNotifications(limit = 20) {
  const {
    data: notifData,
    loading: notifLoading,
    refetch: refetchNotifications,
  } = useQuery<GetNotificationsData>(GET_NOTIFICATIONS, {
    variables: { limit },
    pollInterval: 30000,
  });

  const {
    data: countData,
    refetch: refetchCount,
  } = useQuery<GetUnreadCountData>(GET_UNREAD_NOTIFICATION_COUNT, {
    pollInterval: 30000,
  });

  const [markReadMutation] = useMutation(MARK_NOTIFICATION_READ);
  const [markAllReadMutation] = useMutation(MARK_ALL_NOTIFICATIONS_READ);
  const [deleteMutation] = useMutation(DELETE_NOTIFICATION);

  const notifications: NotificationData[] = notifData?.notifications ?? [];
  const unreadCount: number =
    countData?.notifications_aggregate?.aggregate?.count ?? 0;

  const markRead = async (id: string) => {
    await markReadMutation({ variables: { id } });
    refetchNotifications();
    refetchCount();
  };

  const markAllRead = async () => {
    await markAllReadMutation();
    refetchNotifications();
    refetchCount();
  };

  const deleteNotification = async (id: string) => {
    await deleteMutation({ variables: { id } });
    refetchNotifications();
    refetchCount();
  };

  return {
    notifications,
    unreadCount,
    loading: notifLoading,
    markRead,
    markAllRead,
    deleteNotification,
  };
}
