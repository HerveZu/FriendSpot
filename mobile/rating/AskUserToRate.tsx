import { Feather } from '@expo/vector-icons';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '~/authentication/UserProvider';
import { ThemedIcon } from '~/components/ThemedIcon';
import { Button } from '~/components/nativewindui/Button';
import { BookingToRate } from '~/endpoints/me/get-profile';
import { useRateBooking, UserRating } from '~/endpoints/booking/rate-booking';
import { Modal, ModalTitle } from '~/components/Modal';
import { useLoading } from '~/lib/useFetch';

export function AskUserToRate(props: PropsWithChildren) {
  const { t } = useTranslation();
  const { userProfile } = useCurrentUser();
  const [isModalVisible, setModalVisible] = useState(false);
  const rate = useRateBooking();

  useEffect(() => {
    setModalVisible(!!userProfile.bookingToRate);
  }, [!!userProfile.bookingToRate]);

  return (
    <>
      <Modal
        open={isModalVisible}
        onOpenChange={(open) =>
          !open &&
          userProfile.bookingToRate &&
          rate({
            parkingLotId: userProfile.bookingToRate.parkingLotId,
            bookingId: userProfile.bookingToRate.id,
            userRating: 'Neutral',
          })
        }>
        <ModalTitle text={t('rating.bookingCompleted.title')} />
        <View className="flex-row justify-between">
          <RateButton
            rating={'Good'}
            booking={userProfile.bookingToRate}
            onRated={() => setModalVisible(false)}
          />
          <RateButton
            rating={'Bad'}
            booking={userProfile.bookingToRate}
            onRated={() => setModalVisible(false)}
          />
        </View>
      </Modal>
      {props.children}
    </>
  );
}

const ICON_FOR_RATING: Record<UserRating, string> = {
  Good: 'thumbs-up',
  Bad: 'thumbs-down',
  Neutral: 'dash',
};

function RateButton(props: {
  rating: UserRating;
  booking: BookingToRate | undefined;
  onRated: () => void;
}) {
  const { t } = useTranslation();
  const [rateBooking, isRating] = useLoading(useRateBooking());

  function rate() {
    props.booking &&
      rateBooking({
        parkingLotId: props.booking.parkingLotId,
        bookingId: props.booking.id,
        userRating: props.rating,
      }).finally(() => props.onRated());
  }

  return (
    <Button
      variant="plain"
      onPress={rate}
      accessibilityLabel={t(`rating.buttons.${props.rating.toLowerCase()}`)}>
      {isRating ? (
        <ActivityIndicator />
      ) : (
        <ThemedIcon component={Feather} name={ICON_FOR_RATING[props.rating] as any} size={32} />
      )}
    </Button>
  );
}
