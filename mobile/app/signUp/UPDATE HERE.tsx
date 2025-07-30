import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import {
  CodeField,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { TextInput } from 'react-native-gesture-handler';
import { useSearchParking } from '~/endpoints/parkings/search-parking';
import { AuthProvider } from '~/authentication/AuthProvider';
import { UserProvider } from '~/authentication/UserProvider';

export default function StepThreeScreen() {
  return (
    <AuthProvider>
      <UserProvider>
        <ParkingCodeSearch />
      </UserProvider>
    </AuthProvider>
  );
}

function ParkingCodeSearch() {
  const CELL_COUNT = 6;

  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({ value, setValue });
  const [parking, setParking] = useState('');
  const searchParking = useSearchParking();

  console.log(parking);

  function handleSubmit() {
    const fullCode = `P-${value}`;
    console.log('Code complet saisi :', fullCode);

    searchParking(fullCode);
  }

  return (
    <View className="mt-20 flex items-center text-center">
      <Text className="mb-4 text-lg font-bold">Entrez le code reçu</Text>
      <Text className="mb-4 text-gray-500">Code format : P-123456</Text>

      <View className="flex-row items-center">
        <Text className="mr-2 text-lg font-bold">P -</Text>
        <CodeField
          ref={ref}
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

      <Button onPress={handleSubmit} className="mt-4">
        <Text>Vérifier le code</Text>
      </Button>
    </View>
  );
}
