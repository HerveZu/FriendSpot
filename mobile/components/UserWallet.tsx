import { View, ViewProps } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { LogoCard } from '~/components/Logo';
import React from 'react';
import { useCurrentUser } from '~/authentication/UserProvider';
import { cn } from '~/lib/cn';
import { Modal, ModalFooter, ModalTitle } from '~/components/Modal';
import { Button } from './nativewindui/Button';

export function UserWallet({ className, ...props }: ViewProps) {
  const { userProfile } = useCurrentUser();
  const [infoModalOpen, setInfoModalOpen] = React.useState(false);

  function CreditsExplanation(props: { pending: boolean; explanation: string }) {
    return (
      <View className={'w-full flex-row justify-between items-center gap-6 p-2.5'}>
        <Credits
          pending={props.pending}
          credits={props.pending ? userProfile.wallet.pendingCredits : userProfile.wallet.credits}
          displayCredit={false}
        />
        <View className={'max-w-60'}>
          <Text className={'text-start min-w-60'}>{props.explanation}</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Button className={`gap-6 max-w-44`} variant='tonal' onPress={() => setInfoModalOpen(true)}>
          <Credits pending={false} credits={userProfile.wallet.credits} />
          <Credits pending={true} credits={userProfile.wallet.pendingCredits}/>
      </Button>
      <Modal open={infoModalOpen} onOpenChange={() => setInfoModalOpen(false)}>
        <ModalTitle text={'Comment ça marche ?'} />
        <View className='w-full'>
            <CreditsExplanation
              pending={false}
              explanation='Utilise ces crédits pour réserver un spot disponible.'
            />
            <CreditsExplanation
              pending={true}
              explanation='Crédits qui seront ajoutés à ton solde actuel une fois le prêt de ton spot terminé.'
            />
        </View>
        <ModalFooter text={'Info : Prêter ou réserver 1h = 1 crédit.'} className='border border-primary rounded-md'/>
      </Modal>
    </>
  );
}

export function Credits({
  pending,
  credits,
  className,
  displayCredit=true,
  ...props
}: { pending: boolean; credits: number, displayCredit?: boolean } & ViewProps) {
  return (
    <View className={cn('flex-row items-center gap-2', className)} {...props}>
        <LogoCard primary={!pending} className="h-5 w-3.5 rounded" />
        {displayCredit && <Text className="text-lg font-semibold">{Math.round(credits)}</Text>}
    </View>
  );
}
