import { Feather } from '@expo/vector-icons';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import Modal from 'react-native-modal';

import { useCurrentUser } from '~/authentication/UserProvider';
import { ThemedIcon } from '~/components/ThemedIcon';
import { Button } from '~/components/nativewindui/Button';
import { BookingToRate } from '~/endpoints/get-profile';
import { useRateBooking, UserRating } from '~/endpoints/rate-booking';
import { ModalTitle } from '~/components/Modal';

export function AskUserToRate(props: PropsWithChildren) {
  const { userProfile } = useCurrentUser();
  const rateBooking = useRateBooking();
  const [isModalVisible, setModalVisible] = useState(false);

  function rate(booking: BookingToRate, rating: UserRating) {
    rateBooking({
      parkingLotId: booking.parkingLotId,
      bookingId: booking.id,
      userRating: rating,
    }).finally(() => setModalVisible(false));
  }

  useEffect(() => {
    setModalVisible(!!userProfile.bookingToRate);
  }, [!!userProfile.bookingToRate]);

  return (
    <>
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() =>
          userProfile.bookingToRate && rate(userProfile.bookingToRate, 'Neutral')
        }
        backdropOpacity={0.8}
        className="my-auto">
        <SafeAreaView>
          <View className="flex-col gap-10 rounded-xl bg-card p-6">
            <ModalTitle>Votre réservation s'est terminée, qu'en avez-vous pensé ?</ModalTitle>
            <View className="flex-row justify-between">
              <Button
                variant="plain"
                onPress={() => userProfile.bookingToRate && rate(userProfile.bookingToRate, 'Bad')}>
                <ThemedIcon component={Feather} name="thumbs-down" size={32} />
              </Button>
              <Button
                variant="plain"
                onPress={() =>
                  userProfile.bookingToRate && rate(userProfile.bookingToRate, 'Good')
                }>
                <ThemedIcon component={Feather} name="thumbs-up" size={32} />
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      {props.children}
    </>
  );
}
