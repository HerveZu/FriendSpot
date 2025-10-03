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

  return (
    <>
      <Pressable onPress={() => setInfoModalOpen(true)} {...props}>
        <Card className={cn('mt-2 flex-row items-center justify-center gap-2', className)}>
          <Credits pending={false} credits={userProfile.wallet.credits} />
          <Text>{t('wallet.points', { count: userProfile.wallet.credits })}</Text>
        </Card>
      </Pressable>
      <Modal open={infoModalOpen} onOpenChange={() => setInfoModalOpen(false)}>
        <ModalTitle text={t('wallet.title')} />
        <View className="my-4 w-full">
          <CreditsExplanation
            pending={false}
            explanation={t('wallet.availableCreditsExplanation')}
          />
        </View>
        <ModalFooter text={t('wallet.creditInfo')} className="bg-primary/20 rounded-lg py-2" />
      </Modal>
    </>
  );
}

function CreditsExplanation(props: { pending: boolean; explanation: string }) {
  const { userProfile } = useCurrentUser();

  return (
    <View className={'w-full flex-row items-center justify-between gap-6'}>
      <Credits
        pending={props.pending}
        credits={props.pending ? userProfile.wallet.pendingCredits : userProfile.wallet.credits}
        displayCredit={false}
      />
      <View className={'flex-1'}>
        <Text className={'min-w-60 text-start'}>{props.explanation}</Text>
      </View>
    </View>
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
