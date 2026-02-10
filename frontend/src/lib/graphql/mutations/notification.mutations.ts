import { gql } from '@apollo/client';

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: uuid!) {
    update_notifications_by_pk(pk_columns: { id: $id }, _set: { lue: true }) {
      id
      lue
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    update_notifications(where: { lue: { _eq: false } }, _set: { lue: true }) {
      affected_rows
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: uuid!) {
    delete_notifications_by_pk(id: $id) {
      id
    }
  }
`;
