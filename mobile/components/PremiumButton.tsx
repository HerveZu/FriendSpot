import { Button, ButtonProps } from '~/components/nativewindui/Button';
import { useCurrentUser } from '~/authentication/UserProvider';
import { KnownIcon } from '~/components/ThemedIcon';

export function PremiumButton({
  disabled,
  premiumIf = true,
  children,
  ...props
}: ButtonProps & { premiumIf?: boolean }) {
  const { features } = useCurrentUser();
  const doesntHaveAccess = premiumIf && !features.isPremium;

  return (
    <Button disabled={disabled || doesntHaveAccess} {...props}>
      <>
        {doesntHaveAccess && <KnownIcon name={'premium'} />}
        {children}
      </>
    </Button>
  );
}
