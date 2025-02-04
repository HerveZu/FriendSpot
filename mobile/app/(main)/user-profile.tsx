import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useCurrentUser } from '~/authentication/UserProvider';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth } from '~/authentication/firebase';
import { getAuth, updateEmail, verifyBeforeUpdateEmail } from 'firebase/auth';
import validator from 'validator';
import ContentView from '~/components/ContentView';
import { Text } from '~/components/nativewindui/Text';
import { Rating } from '~/components/Rating';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import { ThemedIcon } from '~/components/ThemedIcon';
import { TextInput } from '~/components/TextInput';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import avatar from '../../assets/avatar.png';
import { useApiRequest } from '~/endpoints/use-api-request';
import { useDebounce } from 'use-debounce';

interface Parking {
  id: string;
  address: string;
  name: string;
}

export default function UserProfileScreen() {
  const { userProfile } = useCurrentUser();
  const [user] = useAuthState(firebaseAuth);
  const { colors } = useColorScheme();

  const [oldEmail, setOldEmail] = useState<string>('');
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const { apiRequest } = useApiRequest();
  const [parking, setParking] = useState<Parking[]>();
  const [search, setSearch] = useState('');
  const [selectedParking, setSelectedParking] = useState<Parking>();
  const [value] = useDebounce(search, 400);

  useEffect(() => {
    apiRequest<Parking[]>(`/parking?search=${value}`, 'GET').then(setParking);
    console.log(parking);
  }, [value]);

  const saveParking = useCallback(async () => {
    try {
      await apiRequest('/@me/spot', 'PUT', {
        parkingId: selectedParking?.id,
      });
    } finally {
      setSelectedParking(undefined);
    }
  }, [selectedParking]);

  const bottomSheetModalRef = useSheetRef();

  const auth = getAuth();

  // Not working because before changing mail, you need re-login user and verify email
  const verifyEmail = async (text: string) => {
    if (validator.isEmail(text)) {
      if (auth.currentUser) {
        await verifyBeforeUpdateEmail(auth.currentUser, text).then(() => {
          if (auth.currentUser) {
            updateEmail(auth.currentUser, text);
          } else {
            return;
          }
        });
      }
    } else {
      setCurrentEmail(oldEmail);
      return;
    }
  };

  useEffect(() => {
    if (user) {
      setCurrentEmail(user.email ?? '');
    }
  }, [user]);

  useEffect(() => {
    if (bookSheetOpen) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [bottomSheetModalRef.current, bookSheetOpen]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ContentView className="w-[95%]">
          <View className="flex-row items-center justify-around gap-5 ">
            <View>
              {userProfile.pictureUrl ? (
                <Image
                  source={{ uri: userProfile.pictureUrl }}
                  style={{ width: 100, height: 100 }}
                />
              ) : (
                <Image source={avatar} style={{ width: 100, height: 100 }} />
              )}
            </View>
            <View className="gap-4">
              <Text variant={'largeTitle'} className={`rounded-lg bg-primary px-2`}>
                {userProfile.displayName}
              </Text>
              <Rating rating={userProfile.rating} stars={3} color={colors.primary} />
            </View>
          </View>
          <View className="mt-10 flex-row items-center ">
            <TextInput
              className="flex h-auto w-full justify-center bg-primary text-lg "
              value={currentEmail}
              editable={true}
              onChangeText={(text) => setCurrentEmail(text)}
              onPressIn={() => {
                setOldEmail(currentEmail);
                setCurrentEmail('');
              }}
              onEndEditing={(event) => verifyEmail(event.nativeEvent.text)}
            />
          </View>
          <View className="mt-10 flex-row items-center justify-center">
            <View className="h-px flex-1 bg-primary" />
            <Text className="mx-4">Mon spot</Text>
            <View className="h-px flex-1 bg-primary" />
          </View>
          <Button
            className="mt-5 h-auto flex-col items-start justify-start"
            onPress={() => setBookSheetOpen(true)}>
            <Text className="pt-1">
              {userProfile.spot ? userProfile.spot.parking.name : 'Aucun nom de parking de défini'}
            </Text>
            <View className="w-11/12 flex-row items-center justify-start gap-2 pb-1">
              <ThemedIcon name={'map-marker'} size={24} />
              <Text className="text-md">
                {userProfile.spot?.parking
                  ? userProfile.spot?.parking?.address
                  : 'Aucune adresse parking définie'}
              </Text>
            </View>
          </Button>
          <View className="mt-8 flex-row justify-around">
            <View className="h-52 w-36 border-2 border-dashed border-primary"></View>
            <View className="mt-5 flex">
              <Text className="text-lg">Place n°</Text>
              <Button className="h-auto">
                <Text className="text-white">
                  {userProfile.spot ? userProfile.spot.name : 'A43'}
                </Text>
              </Button>
            </View>
          </View>
        </ContentView>
        <Sheet
          ref={bottomSheetModalRef}
          enableDynamicSizing={false}
          onDismiss={() => {
            setBookSheetOpen(false), setSearch(''), setSelectedParking(undefined);
          }}
          snapPoints={[550]}>
          <BottomSheetView>
            <SafeAreaView>
              <ContentView>
                <View className="h-full flex-col gap-8 pb-8">
                  <View className="mx-auto w-11/12 grow flex-col gap-6">
                    <View className="flex-row items-center gap-4 rounded-lg border border-foreground">
                      <TextInput
                        className="flex w-full justify-center border border-foreground"
                        editable={true}
                        value={search}
                        onChangeText={(text) => setSearch(text)}
                        onEndEditing={(event) => verifyEmail(event.nativeEvent.text)}
                        placeholder="Rechercher un parking..."
                      />
                    </View>
                    <View className="mx-auto mt-2 h-full gap-8">
                      {parking &&
                        parking.slice(0, 2).map((parking) => (
                          <Button
                            className="min-h-16 w-full min-w-80 justify-between"
                            key={parking.id}
                            onPress={() => {
                              setSelectedParking(parking), setSearch(parking.address);
                            }}>
                            <Text className="max-w-52">{parking.address}</Text>
                            <Text>32 spots</Text>
                          </Button>
                        ))}
                      <Button
                        className="mt-20"
                        disabled={!selectedParking}
                        onPress={() => saveParking()}>
                        <Text>Enregistrer</Text>
                      </Button>
                    </View>
                  </View>
                </View>
              </ContentView>
            </SafeAreaView>
          </BottomSheetView>
        </Sheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
