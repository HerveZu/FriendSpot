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
import { getAuth, signOut } from 'firebase/auth';
import { ContentView } from '~/components/ContentView';
import { Text } from '~/components/nativewindui/Text';
import { Rating } from '~/components/Rating';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import { ThemedIcon } from '~/components/ThemedIcon';
import { TextInput } from '~/components/TextInput';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import avatar2 from '../../assets/avatar-2.png';
import { useApiRequest } from '~/endpoints/use-api-request';
import { useDebounce } from 'use-debounce';
import { MeAvatar } from '~/components/UserAvatar';
import car from '../../assets/car-user-profil.png';
import * as ImagePicker from 'expo-image-picker';
import { LogoCard } from '~/components/Logo';

interface Parking {
  id: string;
  address: string;
  name: string;
}

export default function UserProfileScreen() {
  const [user] = useAuthState(firebaseAuth);
  const { colors } = useColorScheme();
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const { apiRequest } = useApiRequest();
  const [parking, setParking] = useState<Parking[]>();
  const [search, setSearch] = useState('');
  const [selectedParking, setSelectedParking] = useState<Parking>();
  const [value] = useDebounce(search, 400);
  const bottomSheetModalRef = useSheetRef();
  const { userProfile, updateInternalProfile } = useCurrentUser();
  const [currentDisplayName, setCurrentDisplayName] = useState<string>(userProfile.displayName);
  const [oldDisplayName, setOldDisplayName] = useState<string>(userProfile.displayName);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).catch((error) => {
      alert('La déconnexion à échouée');
      console.error('Error signing out: ', error);
    });
  };

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      updateInternalProfile(result.assets[0].uri, userProfile.displayName);
    } else {
      alert("Vous n'avez sélectionné aucune image");
    }
  };

  useEffect(() => {
    apiRequest<Parking[]>(`/parking?search=${value}`, 'GET').then(setParking);
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

  useEffect(() => {
    if (bookSheetOpen) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [bottomSheetModalRef.current, bookSheetOpen]);

  function checkDisplayName() {
    if (currentDisplayName.trim() === '' || currentDisplayName === oldDisplayName) {
      setCurrentDisplayName(oldDisplayName);
      return;
    } else {
      if (user?.photoURL) {
        updateInternalProfile(user?.photoURL, currentDisplayName);
      }
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <ContentView className="bg-gray mx-auto w-full rounded-lg p-4">
            <View className="flex w-full flex-row items-center justify-between gap-4">
              <Button className="" variant="plain" size={'none'} onPress={pickImageAsync}>
                <View
                  className="absolute bottom-0 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                  accessibilityLabel="Edit Avatar">
                  <ThemedIcon name={'pencil'} size={14} color={'white'} />
                </View>
                <MeAvatar className="relative h-32 w-auto" />
              </Button>
              <View className="w-full flex-1 flex-col gap-6">
                <View className="flex-row items-center gap-4">
                  <View className="flex-row gap-2">
                    <Text className="text-xl font-semibold">{userProfile.wallet.credits}</Text>
                    <LogoCard primary className="h-6 w-4 rounded" />
                  </View>
                  <View className="flex-row gap-2">
                    <Text className="text-xl font-semibold">
                      {userProfile.wallet.pendingCredits}
                    </Text>
                    <LogoCard className="h-6 w-4 rounded" />
                  </View>
                </View>
                <Rating rating={userProfile.rating} stars={3} color={colors.primary} />
              </View>
            </View>
            <TextInput
              className="mt-8 rounded-lg border border-foreground p-4"
              icon={'pencil'}
              iconPosition="right"
              iconSize={18}
              value={currentDisplayName}
              editable={true}
              onChangeText={(text) => setCurrentDisplayName(text)}
              onPressIn={() => {
                setOldDisplayName(currentDisplayName);
              }}
              onEndEditing={checkDisplayName}
            />
            <View className="mt-5 w-full rounded-lg border border-foreground px-4 py-3 opacity-50">
              <Text className="text-base">{user?.email}</Text>
            </View>
            <Button
              className="mt-6 h-auto flex-col items-start rounded-lg bg-card"
              onPress={() => setBookSheetOpen(true)}>
              <View className="w-full flex-row items-center justify-between">
                <Text className="max-w-64 text-lg text-foreground">
                  {userProfile.spot
                    ? userProfile.spot.parking.name
                    : 'Aucun nom de parking de défini'}
                </Text>
                <ThemedIcon name={'pencil'} size={18} />
              </View>
              <View className="w-11/12 flex-row items-center justify-start gap-4">
                <ThemedIcon name={'map-marker'} size={20} />
                <Text className="max-w-64 text-sm text-foreground">
                  {userProfile.spot?.parking
                    ? userProfile.spot?.parking?.address
                    : 'Aucune adresse parking définie'}
                </Text>
              </View>
            </Button>
            <View className="mt-6 flex-row justify-center gap-4 rounded-lg border-4 border-card px-2 py-2">
              <View className="mb-2 h-full items-center gap-2">
                {/* <View className="h-40 w-32 rounded-lg border-2 border-dashed border-primary"></View> */}
                <View className="h-26 w-32 flex-1">
                  <Image className="h-full w-full rotate-90" source={car} alt="car" />
                </View>
                <Text className="item-center text-xl font-bold text-foreground">
                  {userProfile.spot ? userProfile.spot.name : 'A43'}
                </Text>
              </View>
              <View className="my-auto h-44 rounded-lg border border-foreground"></View>

              <View className="flex-1 flex-col justify-center gap-6">
                <Text className="text-center text-lg font-bold">En cours d'utilisation</Text>
                <View className="flex flex-col gap-4">
                  <View className="flex-row items-center gap-2">
                    <Image className="h-6 w-6" source={avatar2} alt="avatar" />
                    <Text className="text-base">Jimmy Catalano</Text>
                  </View>
                </View>
                <View className="mt-2 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2">
                  <ThemedIcon name={'clock-o'} size={18} color={'white'} />
                  <Text className="text-center text-sm text-white">Encore 2h</Text>
                </View>
              </View>
            </View>
            <Button className="mt-10 bg-destructive" onPress={() => handleLogout()}>
              <Text>Se déconnecter</Text>
            </Button>
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
                        icon={'search'}
                        iconPosition="left"
                        iconSize={18}
                        editable={true}
                        value={search}
                        onChangeText={(text) => setSearch(text)}
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
                      className="absolute bottom-24 w-full rounded-lg bg-primary "
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
