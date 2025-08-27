import { Button, ButtonProps } from '~/components/nativewindui/Button';
import { useCurrentUser } from '~/authentication/UserProvider';
import { KnownIcon, ThemedIcon } from '~/components/ThemedIcon';
import { Plans } from '~/endpoints/me/get-features';
import { ReactElement, useCallback } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';

export function PremiumButton({
  disabled,
  premiumIf = true,
  children,
  icon,
  premiumIcon,
  ...props
}: ButtonProps & { premiumIf?: boolean; icon?: ReactElement; premiumIcon?: ReactElement }) {
  const { features } = useCurrentUser();
  const doesntHaveAccess = premiumIf && !features.isPremium;

  return (
    <Button disabled={disabled || doesntHaveAccess} {...props}>
      <>
        {doesntHaveAccess ? (premiumIcon ?? <KnownIcon name={'premium'} />) : icon}
        {children}
      </>
    </Button>
  );
}

type PlanInfo = {
  i18nKey: string;
  icon: ReactElement;
  inheritSubscriptionSku?: keyof Plans;
};

export const planInfoMap: Record<keyof Plans, PlanInfo> = {
  premium: {
    i18nKey: 'premium',
    icon: <KnownIcon name={'premium'} size={16} />,
  },
  neighbourhood: {
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
