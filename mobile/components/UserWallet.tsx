import { Pressable, View, ViewProps } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { LogoCard } from '~/components/Logo';
import React from 'react';
import { useCurrentUser } from '~/authentication/UserProvider';
import { cn } from '~/lib/cn';
import { Modal, ModalTitle } from '~/components/Modal';

export function UserWallet({ className, ...props }: ViewProps) {
  const { userProfile } = useCurrentUser();
  const [infoModalOpen, setInfoModalOpen] = React.useState(false);

  function CreditsExplanation(props: { pending: boolean; explanation: string }) {
    return (
      <View className={'ml-1 w-full flex-row justify-between gap-12'}>
        <Credits
          pending={props.pending}
          credits={props.pending ? userProfile.wallet.pendingCredits : userProfile.wallet.credits}
        />
        <View className={'flex-1'}>
          <Text className={'text-start'}>{props.explanation}</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Pressable onPress={() => setInfoModalOpen(true)}>
        <View className={cn('flex-row items-center gap-8', className)} {...props}>
          <Credits pending={false} credits={userProfile.wallet.credits} />
          <Credits pending={true} credits={userProfile.wallet.pendingCredits} />
        </View>
      </Pressable>
      <Modal open={infoModalOpen} onOpenChange={() => setInfoModalOpen(false)}>
        <ModalTitle text={'Mes crédits'} />
        <View className={'gap-6'}>
          <CreditsExplanation
            pending={false}
            explanation={'Utilise ces crédits pour réserver un spot.'}
          />
          <CreditsExplanation
            pending={true}
            explanation={
              'Ces crédits sont réservés et te seront accesible à la fin de la réservation associée.'
            }
          />
        </View>
      </Modal>
    </>
  );
}

export function Credits({
  pending,
  credits,
  className,
  ...props
}: { pending: boolean; credits: number } & ViewProps) {
  return (
    <View className={cn('w-12 flex-row items-center gap-2', className)} {...props}>
      <LogoCard primary={!pending} className="h-5 w-3 rounded" />
      <Text className="text-lg font-semibold">{Math.round(credits)}</Text>
    </View>
  );
}
