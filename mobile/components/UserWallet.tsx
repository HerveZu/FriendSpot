import { Pressable, View, ViewProps } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { LogoCard } from '~/components/Logo';
import React from 'react';
import { useCurrentUser } from '~/authentication/UserProvider';
import { cn } from '~/lib/cn';
import { Modal, ModalFooter, ModalTitle } from '~/components/Modal';
import { Card } from '~/components/Card';
import { useTranslation } from 'react-i18next';

export function UserWallet({ className, ...props }: ViewProps) {
  const { t } = useTranslation();
  const { userProfile } = useCurrentUser();
  const [infoModalOpen, setInfoModalOpen] = React.useState(false);

  function CreditsExplanation(props: { pending: boolean; explanation: string }) {
    return (
      <View className={'w-full flex-row items-center justify-between gap-6 p-2.5'}>
        <Credits
          pending={props.pending}
          credits={props.pending ? userProfile.wallet.pendingCredits : userProfile.wallet.credits}
          displayCredit={false}
        />
        <View className={'max-w-60'}>
          <Text className={'min-w-60 text-start'}>{props.explanation}</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Pressable onPress={() => setInfoModalOpen(true)} {...props}>
        <Card className={cn(`flex-row  items-center justify-center mt-2`, className)}>
          <Text className='text-sm'>Mes points :</Text>
          <Credits pending={false} credits={userProfile.wallet.credits} />
        </Card>
      </Pressable>
      <Modal open={infoModalOpen} onOpenChange={() => setInfoModalOpen(false)}>
        <ModalTitle text={t('wallet.howItWorks')} />
        <View className="w-full">
          <CreditsExplanation
            pending={false}
            explanation={t('wallet.availableCreditsExplanation')}
          />
          <CreditsExplanation pending={true} explanation={t('wallet.pendingCreditsExplanation')} />
        </View>
        <ModalFooter text={t('wallet.creditInfo')} className="bg-primary/20 rounded-lg py-2" />
      </Modal>
    </>
  );
}

export function Credits({
  pending,
  credits,
  className,
  displayCredit = true,
  ...props
}: { pending: boolean; credits: number; displayCredit?: boolean } & ViewProps) {
  return (
    <View className={cn('flex-row items-center gap-2', className)} {...props}>
      <LogoCard primary={!pending} className="h-5 w-3.5 rounded" />
      {displayCredit && <Text className="text-lg font-semibold">{credits}</Text>}
    </View>
  );
}
