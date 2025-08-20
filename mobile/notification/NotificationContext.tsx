import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { EventSubscription } from 'expo-modules-core';
import { registerForPushNotificationsAsync } from '~/notification/registerForPushNotificationsAsync';

interface NotificationContextType {
  expoPushToken: string | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowList: false,
  }),
});

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
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<EventSubscription>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => setExpoPushToken(token),
      (error) => setError(error)
    );

    const listenerRef = notificationListener.current;

    return () => {
      if (listenerRef) {
        Notifications.removeNotificationSubscription(listenerRef);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ expoPushToken, error }}>
      {children}
    </NotificationContext.Provider>
  );
};
