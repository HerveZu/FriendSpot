import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useCurrentUser } from '~/authentication/UserProvider';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth } from '~/authentication/firebase';
import { getAuth, updateEmail, verifyBeforeUpdateEmail } from 'firebase/auth';
import validator from 'validator';
import { ContentView } from '~/components/ContentView';
import { Text } from '~/components/nativewindui/Text';
import { Rating } from '~/components/Rating';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import { ThemedIcon } from '~/components/ThemedIcon';
import { TextInput } from '~/components/TextInput';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import avatar from '../../assets/avatar.png';
import avatar2 from '../../assets/avatar-2.png';
import { useApiRequest } from '~/endpoints/use-api-request';
import { useDebounce } from 'use-debounce';
import car from '../../assets/car-user-profil.png';

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

  // useEffect(() => {
  //   apiRequest<Parking[]>(`/parking?search=${value}`, 'GET').then(setParking);
  //   console.log(parking);
  // }, [value]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <ContentView className="mx-auto w-full rounded-lg p-4">
            <View className="flex-row items-center justify-around gap-5 ">
              <View className="">
                {userProfile.pictureUrl ? (
                  <Image
                    source={{ uri: userProfile.pictureUrl }}
                    style={{ width: 130, height: 130, borderRadius: 50 }}
                  />
                ) : (
                  <View className="shadow-lg shadow-primary">
                    <Image source={avatar} style={{ width: 130, height: 130, borderRadius: 65 }} />
                  </View>
                )}
              </View>
              <View className="items-center gap-4">
                <Text variant={'title1'} className="rounded-lg bg-primary px-2 text-white">
                  {userProfile.displayName}
                </Text>
                <Rating rating={userProfile.rating} stars={3} color={colors.primary} />
              </View>
            </View>
            <TextInput
              className="my-auto mt-10 h-auto w-full justify-center rounded-lg bg-primary text-lg"
              style={{ color: 'white' }}
              value={currentEmail}
              editable={true}
              onChangeText={(text) => setCurrentEmail(text)}
              onPressIn={() => {
                setOldEmail(currentEmail);
                setCurrentEmail('');
              }}
              onEndEditing={(event) => verifyEmail(event.nativeEvent.text)}
            />
            <View className="mt-8 flex-row items-center justify-center">
              <View className="h-px flex-1 bg-primary" />
              <Text className="mx-4 text-primary">Mon spot</Text>
              <View className="h-px flex-1 bg-primary" />
            </View>
            <Button
              className="mt-8 h-auto flex-col items-start rounded-lg bg-primary"
              onPress={() => setBookSheetOpen(true)}>
              <View className="w-full flex-row items-center justify-between px-1">
                <Text className="text-lg text-white">
                  {userProfile.spot
                    ? userProfile.spot.parking.name
                    : 'Aucun nom de parking de défini'}
                </Text>
                <ThemedIcon name={'pencil'} size={18} color={'white'} />
              </View>
              <View className="w-11/12 flex-row items-center justify-start gap-2">
                <ThemedIcon name={'map-marker'} size={20} color={'white'} />
                <View>
                  <Text className="text-sm text-white ">
                    {userProfile.spot?.parking
                      ? userProfile.spot?.parking?.address
                      : 'Aucune adresse parking définie'}
                  </Text>
                </View>
              </View>
            </Button>
            <View className=" mt-8 flex-row justify-center gap-4 rounded-lg border-2 border-primary px-2 py-2">
              <View className="mb-2 flex-1 items-center gap-5 ">
                <View className="flex-row items-center gap-2 ">
                  <Text className="max-w-32 text-ellipsis rounded-lg text-sm">
                    Utilisé par {'\n'}{' '}
                    <Text className="text-primary">
                      {userProfile.spot?.currentlyUsedBy?.displayName ?? 'Jean-marc'}
                    </Text>
                  </Text>
                  <Image source={avatar2} style={{ width: 25, height: 25, borderRadius: 65 }} />
                </View>
                {/* <View className="h-40 w-32 rounded-lg border-2 border-dashed border-primary"></View> */}
                <View className="justify-centert h-32 w-40">
                  <Image className="h-full w-full rotate-90 " source={car} alt="car" />
                </View>
              </View>
              <View className="my-auto h-44 rounded-lg border-2 border-white"></View>
              <View className="mt-5 flex-1 items-center gap-2">
                <Text className="text-xl">Place n°</Text>
                <Button className="h-auto w-[50%] rounded-lg bg-primary p-2">
                  <Text className="text-xl text-white">
                    {userProfile.spot ? userProfile.spot.name : 'A43'}
                  </Text>
                </Button>
              </View>
            </View>
          </ContentView>
        </ScrollView>
        <Sheet
          ref={bottomSheetModalRef}
          enableDynamicSizing={false}
          onDismiss={() => {
            setBookSheetOpen(false), setSearch(''), setSelectedParking(undefined);
          }}
          snapPoints={[550]}>
          <BottomSheetView>
            <SafeAreaView>
              <ContentView className="rounded-lg p-4">
                <View className="h-full flex-1 flex-col gap-8 pb-8 ">
                  <View className="mx-auto grow flex-col gap-6">
                    <View className="flex-row items-center gap-4 rounded-lg border border-primary p-2">
                      <TextInput
                        className="flex w-full justify-center rounded-lg p-2 text-base"
                        editable={true}
                        value={search}
                        onChangeText={(text) => setSearch(text)}
                        onEndEditing={(event) => verifyEmail(event.nativeEvent.text)}
                        placeholder="Rechercher un parking"
                      />
                    </View>
                    <View className="relative mt-2 h-full gap-8">
                      {parking &&
                        parking.slice(0, 2).map((parking) => (
                          <Button
                            className="min-h-16 w-full min-w-80 justify-between rounded-lg bg-primary p-2"
                            key={parking.id}
                            onPress={() => {
                              setSelectedParking(parking), setSearch(parking.address);
                            }}>
                            <Text className="max-w-52">{parking.address}</Text>
                            <Text className="text-white">32 spots</Text>
                          </Button>
                        ))}
                    </View>
                    <Button
                      className="absolute bottom-24 mt-auto w-full rounded-lg bg-primary p-2"
                      disabled={!selectedParking}
                      onPress={() => saveParking()}>
                      <Text className="py-2 text-white">Enregistrer</Text>
                    </Button>
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
