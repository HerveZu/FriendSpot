import { Button, ButtonProps } from '~/components/nativewindui/Button';
import { useCurrentUser } from '~/authentication/UserProvider';
import { KnownIcon, ThemedIcon } from '~/components/ThemedIcon';
import { Plans } from '~/endpoints/me/get-features';
import { ReactElement, ReactNode, useCallback } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GestureResponderEvent } from 'react-native';

export function PremiumButton({
  children,
  icon,
  premiumIcon,
  disabled,
  onPress,
  premiumContent,
  hasNoAccess,
  ...props
}: ButtonProps & {
  icon?: ReactElement;
  premiumIcon?: ReactElement;
  premiumContent: ReactNode;
  hasNoAccess?: boolean;
}) {
  const { features } = useCurrentUser();
  const router = useRouter();
  const doesntHaveAccess = hasNoAccess || !features.isPremium;

  function handleOnPress(e: GestureResponderEvent) {
    if (doesntHaveAccess) {
      router.push('/friendspot-plus');
      return;
    }

    onPress?.(e);
  }

  return (
    <Button disabled={!doesntHaveAccess && disabled} onPress={handleOnPress} {...props}>
      <>
        {doesntHaveAccess ? (premiumIcon ?? <KnownIcon name={'premium'} />) : icon}
        {doesntHaveAccess ? premiumContent : children}
      </>
    </Button>
  );
}

type PlanInfo = {
  order: number;
  i18nKey: string;
  icon: ReactElement;
  inheritSubscriptionSku?: keyof Plans;
};

export const planInfoMap: Record<keyof Plans, PlanInfo> = {
  premium: {
    order: 0,
    i18nKey: 'premium',
    icon: <KnownIcon name={'premium'} size={16} />,
  },
  neighbourhood: {
    order: 1,
    inheritSubscriptionSku: 'premium',
    i18nKey: 'neighbourhood',
    icon: <ThemedIcon name={'house'} component={FontAwesome6} size={16} />,
  },
};

export function useGetPlanInfo() {
  const { features } = useCurrentUser();

  return useCallback(
    (productId: string) => {
      const planKey = Object.entries(features.plans).find(
        ([, x]) => x.productId === productId
      )?.[0] as keyof Plans | undefined;

      if (!planKey) {
        return null;
      }

      return planInfoMap[planKey];
    },
    [features.plans]
  );
}
