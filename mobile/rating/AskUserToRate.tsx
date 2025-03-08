import { Feather } from '@expo/vector-icons';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { View } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';
import { ThemedIcon } from '~/components/ThemedIcon';
import { Button } from '~/components/nativewindui/Button';
import { BookingToRate } from '~/endpoints/get-profile';
import { useRateBooking, UserRating } from '~/endpoints/rate-booking';
import { Modal, ModalTitle } from '~/components/Modal';

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
        open={isModalVisible}
        onOpenChange={(open) =>
          !open && userProfile.bookingToRate && rate(userProfile.bookingToRate, 'Neutral')
        }>
        <ModalTitle text={"Votre réservation s'est terminée, qu'en avez-vous pensé ?"} />
        <View className="flex-row justify-between">
          <Button
            variant="plain"
            onPress={() => userProfile.bookingToRate && rate(userProfile.bookingToRate, 'Bad')}>
            <ThemedIcon component={Feather} name="thumbs-down" size={32} />
          </Button>
          <Button
            variant="plain"
            onPress={() => userProfile.bookingToRate && rate(userProfile.bookingToRate, 'Good')}>
            <ThemedIcon component={Feather} name="thumbs-up" size={32} />
          </Button>
        </View>
      </Modal>
      {props.children}
    </>
  );
}
