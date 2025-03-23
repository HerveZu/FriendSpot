import { Pressable, View, ViewProps } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { LogoCard } from '~/components/Logo';
import React from 'react';
import { useCurrentUser } from '~/authentication/UserProvider';
import { cn } from '~/lib/cn';
import { Modal, ModalFooter, ModalTitle } from '~/components/Modal';

export function UserWallet({ className, ...props }: ViewProps) {
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
      <Pressable
        className={cn(
          `bg-primary/20 w-40 flex-row justify-between gap-4 rounded-lg px-4 py-2`,
          className
        )}
        onPress={() => setInfoModalOpen(true)}
        {...props}>
        <Credits pending={false} credits={userProfile.wallet.credits} />
        <Credits pending={true} credits={userProfile.wallet.pendingCredits} />
      </Pressable>
      <Modal open={infoModalOpen} onOpenChange={() => setInfoModalOpen(false)}>
        <ModalTitle text={'Comment ça marche ?'} />
        <View className="w-full">
          <CreditsExplanation
            pending={false}
            explanation="Utilise ces crédits pour réserver un spot disponible."
          />
          <CreditsExplanation
            pending={true}
            explanation="Crédits qui seront ajoutés à ton solde actuel une fois le prêt de ton spot terminé."
          />
        </View>
        <ModalFooter
          text={'Info : Prêter ou réserver 1h = 1 crédit.'}
          className="rounded-lg border border-primary py-2"
        />
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
      {displayCredit && <Text className="text-lg font-semibold">{Math.round(credits)}</Text>}
    </View>
  );
}
