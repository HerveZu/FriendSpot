import { useCurrentUser } from '~/authentication/UserProvider';
import { useCallback } from 'react';
import { useAuth } from '~/authentication/AuthProvider';

const reviewConfig = {
  webhookUrl: process.env.EXPO_PUBLIC_REVIEW_WEBHOOK_URL,
};

export function useSendReview() {
  const { userProfile } = useCurrentUser();
  const { firebaseUser } = useAuth();

  return useCallback(
    (review: string) => {
      const body = {
        embeds: [
          {
            title: `Feedback de ${userProfile.displayName}`,
            description: review,
            footer: {
              text: `${userProfile.displayName} - ${firebaseUser.email}`,
            },
          },
        ],
      };

      return fetch(reviewConfig.webhookUrl!, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    [userProfile, firebaseUser]
  );
}
