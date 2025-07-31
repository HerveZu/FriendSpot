import { View } from 'react-native';
import { Modal, ModalTitle } from '~/components/Modal';
import React, { useEffect, useState } from 'react';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import {
  CodeField,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { useSearchParking } from '~/endpoints/parkings/search-parking';
import { useDefineSpot } from '~/endpoints/parkings/define-spot';
import { useFetch } from '~/lib/useFetch';
import { ParkingResponse } from '~/endpoints/parkings/parking-response';
import { TextInput } from 'react-native-gesture-handler';

export default function JoinParking() {
  const CELL_COUNT = 6;
  const PARKING_PREFIX = 'P-';
  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({ value, setValue });

  const [open, setOpen] = useState<boolean>(false);
  const defineSpot = useDefineSpot();
  const searchParking = useSearchParking();
  const [parking, setParking] = useFetch<ParkingResponse>(
    () =>
      value.length === CELL_COUNT &&
      searchParking(`${PARKING_PREFIX}${value}`).then((results) => results[0]),
    [value]
  );

  // useEffect(() => {
  //   if (parking) {
  //     setOpen(true);
  //   }
  // }, [parking]);

  // function joinParking(lotName: string) {
  //   if (!parking) {
  //     return;
  //   }
  //   defineSpot({
  //     parkingId: parking.id,
  //     lotName: parking.name,
  //   });
  // }

  return (
    <>
      <Modal open={open} onOpenChange={setOpen} vibration={true}>
        <ModalTitle text={'Groupe trouvé !'} />
        <View className="gap-4">
          <Text>Nom du groupe : {parking?.name}</Text>
          <Text>Information : {parking?.address}</Text>
          <Text>Nombre de membre : {parking?.spotsCount}</Text>
          <Text className="text-base text-foreground">{'Voulez-vous le rejoindre ?'}</Text>
          <View className="flex-row items-center gap-4">
            <Button size={'lg'} variant="tonal" onPress={() => setOpen(false)} className="flex-1">
              <Text className="">Non</Text>
            </Button>
            <Button size={'lg'} variant="primary" onPress={() => ''} className="flex-1">
              <Text className="">Oui !</Text>
            </Button>
          </View>
        </View>
      </Modal>
      <View className="mt-20 flex items-center text-center">
        <Text className="text-lg font-bold">Entrez un code de groupe</Text>
        <View className="mt-10 flex-row items-center">
          <Text className="mr-2s text-lg font-bold">P -</Text>
          <CodeField
            ref={ref as any}
            {...props}
            value={value}
            onChangeText={setValue}
            cellCount={CELL_COUNT}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            InputComponent={TextInput}
            renderCell={({ index, symbol, isFocused }) => (
              <Text
                key={index}
                style={{
                  width: 40,
                  height: 40,
                  lineHeight: 38,
                  fontSize: 24,
                  borderWidth: 2,
                  borderColor: isFocused ? '#000' : '#ccc',
                  textAlign: 'center',
                  marginHorizontal: 5,
                }}
                onLayout={getCellOnLayoutHandler(index)}>
                {symbol || (isFocused ? '|' : null)}
              </Text>
            )}
          />
        </View>
      </View>
    </>
  );
}
