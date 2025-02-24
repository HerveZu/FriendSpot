import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { EventSubscription } from 'expo-modules-core';
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotificationsAsync';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Linking } from 'react-native';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<EventSubscription>();
  const responseListener = useRef<EventSubscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => setExpoPushToken(token),
      (error) => setError(error)
    );

    // Add a send POST with expoPushToken at backend

    // notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
    //   console.log('🔔 Notification Received: ', notification);
    //   setNotification(notification);
    // });

    // responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
    //   console.log(
    //     '🔔 Notification Response: ',
    //     JSON.stringify(response, null, 2),
    //     JSON.stringify(response.notification.request.content.data, null, 2)
    //   );
    // });

    // return () => {
    //   if (notificationListener.current) {
    //     Notifications.removeNotificationSubscription(notificationListener.current);
    //   }
    //   if (responseListener.current) {
    //     Notifications.removeNotificationSubscription(responseListener.current);
    //   }
    // };
  }, []);

  const displayNotification = async (title: string, body: string, data: object) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: { data: data },
      },
      trigger: null,
    });
  };

  const [socketUrl, setSocketUrl] = useState('ws://localhost:8080');

  const { lastMessage, readyState } = useWebSocket(socketUrl);

  useEffect(() => {
    if (lastMessage !== null) {
      const messageData = JSON.parse(lastMessage.data);
      displayNotification(messageData.title, messageData.body, messageData.data);
    }
  }, [lastMessage]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, error }}>
      {children}
    </NotificationContext.Provider>
  );
};
