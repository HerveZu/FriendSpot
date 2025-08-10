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

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedContentModal, setSelectedContentModal] = useState<number>(1);
  const [lotName, setLotName] = useState<string>('');
  const defineSpot = useDefineSpot();
  const searchParking = useSearchParking();
  const [parking, setParking] = useFetch<ParkingResponse>(
    () =>
      value.length === CELL_COUNT &&
      searchParking(`${PARKING_PREFIX}${value}`).then((results) => results[0]),
    [value]
  );

  const modalContent = [
    {
      title: 'Groupe trouvé !',
      text1: `Nom du groupe : ${parking?.name}`,

      text2: `Information : ${parking?.address}`,
      text3: `Nombre de membre : ${parking?.spotsCount}`,
      text4: `Voulez vous le rejoindre ?`,
      actionButtonCancel: () => setOpenModal(false),
      actionButtonValide: () => setSelectedContentModal(2),
    },
    {
      title: 'Numéro de spot',
      text1: `Spécifier votre numéro de spot : ${parking?.name}`,
      actionButtonValide: () => {
        joinParking(lotName);
      },
    },
  ];

  useEffect(() => {
    if (parking) {
      setOpenModal(true);
    }
  }, [parking]);

  function joinParking(lotName: string) {
    if (!parking) {
      return;
    }
    defineSpot({
      parkingId: parking.id,
      lotName: parking.name,
    });
    setOpenModal(false);
  }

  return (
    <>
      <Modal open={openModal} onOpenChange={setOpenModal} vibration={true}>
        {selectedContentModal === 1 ? (
          <>
            <ModalTitle text={modalContent[0].title} />
            <View className="gap-4">
              <Text>{modalContent[0].text1}</Text>
              <Text>{modalContent[0].text2}</Text>
              <Text>{modalContent[0].text3}</Text>
              <Text className="text-base text-foreground">{modalContent[0].text4}</Text>
              <View className="flex-row items-center gap-4">
                <Button
                  size={'lg'}
                  variant="tonal"
                  onPress={modalContent[0].actionButtonCancel}
                  className="flex-1">
                  <Text className="">Non</Text>
                </Button>
                <Button
                  size={'lg'}
                  variant="primary"
                  onPress={modalContent[0].actionButtonValide}
                  className="flex-1">
                  <Text className="">Oui !</Text>
                </Button>
              </View>
            </View>
          </>
        ) : (
          <>
            <ModalTitle text={modalContent[1].title} />
            <View className="gap-4">
              <Text>{modalContent[1].text1}</Text>
              <Text className="text-base text-foreground">{modalContent[1].text4}</Text>
              <View className="items-center gap-6">
                <TextInput
                  className="h-5 w-32 border border-primary text-foreground"
                  placeholder="A22"
                  value={lotName}
                  onChangeText={setLotName}
                />
                <Button
                  size={'md'}
                  variant="primary"
                  onPress={modalContent[1].actionButtonValide}
                  className="">
                  <Text className="">Valider</Text>
                </Button>
              </View>
            </View>
          </>
        )}
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
