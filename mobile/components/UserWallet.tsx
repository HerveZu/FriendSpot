import { Pressable, View, ViewProps } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { LogoCard } from '~/components/Logo';
import React from 'react';
import { useCurrentUser } from '~/authentication/UserProvider';
import { cn } from '~/lib/cn';
import { Modal, ModalTitle } from '~/components/Modal';
import { usePathname } from 'expo-router';

import { Button } from './nativewindui/Button';


export function UserWallet({ className, ...props }: ViewProps) {
  const { userProfile } = useCurrentUser();
  const [infoModalOpen, setInfoModalOpen] = React.useState(false);

  const pathname = usePathname();

  const mySpot = pathname === '/my-spot';

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
      <Button className={`gap-6 ${mySpot ? "w-6/12" : "w-10/12"}`} variant='tonal' onPress={() => setInfoModalOpen(true)}>
          <Credits pending={false} credits={userProfile.wallet.credits} />
          <Credits pending={true} credits={userProfile.wallet.pendingCredits} />
      </Button>
      <Modal open={infoModalOpen} onOpenChange={() => setInfoModalOpen(false)}>
        <ModalTitle text={'Mes crédits'} />
        <View className='items-center'>
        </View>
        <View className='gap-6'>
          <CreditsExplanation
            pending={false}
            explanation='Utilise ces crédits pour réserver un spot.'
          />
          <CreditsExplanation
            pending={true}
            explanation='Crédits qui seront ajoutés à ton nombre de crédits actuel après avoir prêté ton spot.'
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
    <View className={cn('flex-row items-center gap-2', className)} {...props}>
      <LogoCard primary={!pending} className="h-5 w-3.5 rounded" />
      <Text className="text-lg font-semibold">{Math.round(credits)}</Text>
    </View>
  );
}
