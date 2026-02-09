import { gql } from '@apollo/client';

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($limit: Int = 20) {
    notifications(order_by: { date: desc }, limit: $limit) {
      id
      type
      titre
      message
      lue
      date
      ruche_id
      intervention_id
      ruche {
        id
        immatriculation
      }
    }
  }
`;

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount {
    notifications_aggregate(where: { lue: { _eq: false } }) {
      aggregate {
        count
      }
    }
  }
`;
