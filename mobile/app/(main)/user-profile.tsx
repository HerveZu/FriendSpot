import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useCurrentUser } from '~/authentication/UserProvider';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth } from '~/authentication/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { ContentSheetView, ContentView } from '~/components/ContentView';
import { Text } from '~/components/nativewindui/Text';
import { Rating } from '~/components/Rating';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import { ThemedIcon } from '~/components/ThemedIcon';
import { TextInput } from '~/components/TextInput';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { useApiRequest } from '~/endpoints/use-api-request';
import { useDebounce } from 'use-debounce';
import { MeAvatar, UserAvatar } from '~/components/UserAvatar';
import car from '../../assets/car-user-profile.png';
import * as ImagePicker from 'expo-image-picker';
import { LogoCard } from '~/components/Logo';
import { useActualTime } from '~/lib/useActualTime';
import { differenceInMinutes, minutesToHours, formatRelative } from 'date-fns';
import { useUploadUserPicture } from '~/endpoints/upload-user-picture';
interface Parking {
  id: string;
  address: string;
  name: string;
  spotsCount: number;
}

export default function UserProfileScreen() {
  const [user] = useAuthState(firebaseAuth);
  const { colors } = useColorScheme();
  const [bottomSheet, setBottomSheet] = useState(false);
  const { apiRequest } = useApiRequest();
  const [parking, setParking] = useState<Parking[]>();
  const [search, setSearch] = useState('');
  const [selectedParking, setSelectedParking] = useState<Parking>();
  const { userProfile, updateInternalProfile, refreshProfile } = useCurrentUser();
  const [currentDisplayName, setCurrentDisplayName] = useState<string>(userProfile.displayName);
  const [oldDisplayName, setOldDisplayName] = useState<string>(userProfile.displayName);
  const bottomSheetModalRef = useSheetRef();
  const [currentSpotName, setCurrentSpotName] = useState<string>(userProfile.spot?.name || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchDebounce] = useDebounce(search, 200);

  const available = userProfile?.spot?.currentlyAvailable;
  const usingUntil = userProfile?.spot?.currentlyUsedBy?.usingUntil;
  const currentlyUsedBy = userProfile.spot?.currentlyUsedBy;

  const spotUsedBeMe = !available && !currentlyUsedBy;

  const now = useActualTime(30_000);
  const uploadPicture = useUploadUserPicture();

  const checkIfPlural = (value: number, text: string) => {
    if (value > 1) {
      return text + 's';
    } else {
      return text;
    }
  };

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
    if (result.canceled) {
      return;
    }
    const response = await fetch(result.assets[0].uri);
    const imageBody = await response.blob();
    const { writeUrl, readonlyUrl } = await uploadPicture();
    await fetch(writeUrl, {
      method: 'PUT',
      body: imageBody,
    });
    await updateInternalProfile(`${readonlyUrl}#_n=${Math.random()}`, userProfile.displayName);
  };

  useEffect(() => {
    apiRequest<Parking[]>(`/parking?search=${searchDebounce}`, 'GET').then(setParking);
  }, [searchDebounce]);

  useEffect(() => {
    if (bottomSheet) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [bottomSheetModalRef.current, bottomSheet]);

  function checkAndUpdateDisplayName() {
    if (currentDisplayName.trim() === '' || currentDisplayName === oldDisplayName) {
      setCurrentDisplayName(oldDisplayName);
      return;
    } else {
      if (user?.photoURL) {
        updateInternalProfile(user?.photoURL, currentDisplayName);
      }
    }
  }

  async function updateParking() {
    setIsLoading(true);
    if (!selectedParking || !currentSpotName) {
      return;
    }

    apiRequest('/@me/spot', 'PUT', {
      parkingId: selectedParking.id,
      lotName: currentSpotName,
    })
      .then(refreshProfile)
      .then(() => setBottomSheet(false))
      .finally(() => setIsLoading(false));
  }

  const DisplayCar = () => {
    if (spotUsedBeMe || !!currentlyUsedBy) {
      return (
        <View className="relative h-28 w-[105px] flex-1">
          {!!currentlyUsedBy && (
            <UserAvatar
              displayName={userProfile.spot.currentlyUsedBy.displayName}
              pictureUrl={userProfile.spot.currentlyUsedBy.pictureUrl}
              className="absolute left-[-5] top-[-5] z-10 h-8 w-8"
            />
          )}
          <Image
            className="h-full w-full"
            source={car}
            alt="car"
            style={{ transform: [{ rotate: '90deg' }], resizeMode: 'contain' }}
          />
        </View>
      );
    } else {
      return (
        <View className="h-40 w-28 flex-1 rounded-lg border-2 border-dashed border-primary"></View>
      );
    }
  };

  const SpotUsedBy = () => {
    if (!userProfile.spot) {
      return;
    }
    const getRemainingTime = (endTime: Date | null | undefined) => {
      if (endTime) {
        const now = new Date();
        const diffInMinutes = differenceInMinutes(endTime, now);

        if (diffInMinutes <= 0) {
          return 'Temps écoulé';
        }

        const hours = minutesToHours(diffInMinutes);
        const minutes = diffInMinutes % 60;

        if (hours > 0) {
          return `${hours} ${checkIfPlural(hours, 'heure')} et ${minutes} ${checkIfPlural(minutes, 'minute')}`;
        } else {
          return `${minutes} ${checkIfPlural(minutes, 'minute')}`;
        }
      }
      return '';
    };
    if (!!currentlyUsedBy) {
      return (
        <View className="w-full flex-1 flex-col justify-center gap-6">
          <Text className="text-center text-base font-bold">En cours d'utilisation</Text>
          <Text className="text-center">Par {currentlyUsedBy.displayName}</Text>

          <View className="mt-2 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2">
            <ThemedIcon name={'clock-o'} size={18} color={'white'} />
            {userProfile.spot?.currentlyUsedBy?.usingUntil && (
              <Text className="text-center text-sm text-white">
                {`Pendant ${getRemainingTime(usingUntil)}`}
              </Text>
            )}
          </View>
        </View>
      );
    } else {
      return (
        <View className="w-full flex-1 flex-col justify-center gap-6">
          <Text className="text-center text-lg font-bold">{`${available ? 'Ton spot est libre' : 'Tu occupes ta place'}`}</Text>
          {userProfile.spot?.nextUse && (
            <Text className="text-center">
              Jusqu'à {formatRelative(userProfile.spot.nextUse, now)}
            </Text>
          )}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={65}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <ContentView className="bg-gray mx-auto w-full rounded-lg p-4">
            <View className="flex w-full flex-row items-center gap-6">
              <Button className="" variant="plain" size={'none'} onPress={pickImageAsync}>
                <View
                  className="absolute bottom-0 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                  accessibilityLabel="Edit Avatar">
                  <ThemedIcon name={'pencil'} size={14} color={'white'} />
                </View>
                <MeAvatar className="relative h-32 w-32" />
              </Button>
              <View className="w-full gap-6">
                <View className="gap-2">
                  <Text className="text-xl font-bold">{currentDisplayName}</Text>
                  <Rating rating={userProfile.rating} stars={3} color={colors.primary} />
                </View>
                <View className="flex-row items-center gap-4">
                  <View className="flex-row gap-2">
                    <Text className="text-base font-semibold">{userProfile.wallet.credits}</Text>
                    <LogoCard primary className="h-6 w-4 rounded" />
                  </View>
                  <View className="flex-row gap-2">
                    <Text className="text-base font-semibold">
                      {userProfile.wallet.pendingCredits}
                    </Text>
                    <LogoCard className="h-6 w-4 rounded" />
                  </View>
                </View>
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
              onEndEditing={checkAndUpdateDisplayName}
            />
            <View className="mt-5 w-full rounded-lg border border-foreground px-4 py-3 opacity-50">
              <Text className="text-base">{user?.email}</Text>
            </View>
            <Button
              className="mt-6 h-auto flex-col items-start rounded-lg bg-card"
              onPress={() => setBottomSheet(true)}>
              <View className="w-full flex-row items-center justify-between pt-0.5">
                <Text className="max-w-64 text-lg text-foreground">
                  {userProfile.spot
                    ? userProfile.spot.parking.name
                    : 'Aucun nom de parking de défini'}
                </Text>
                <ThemedIcon name={'pencil'} size={18} />
              </View>
              <View className="w-11/12 flex-row items-center justify-start gap-4 pb-1">
                <ThemedIcon name={'map-marker'} size={20} />
                <Text className="max-w-64 text-sm text-foreground">
                  {userProfile.spot?.parking
                    ? userProfile.spot?.parking?.address
                    : 'Aucune adresse parking définie'}
                </Text>
              </View>
            </Button>

            <View className="border-border-red-500 mt-6 flex-row justify-center gap-4 rounded-lg border-4 border-card px-4 py-5">
              <View className="mb-2 h-full items-center">
                <DisplayCar />
                <Text className="item-center mt-2 text-xl font-bold text-foreground">
                  {userProfile.spot ? userProfile.spot.name : ''}
                </Text>
              </View>
              <View className="my-auto h-44 rounded-lg border-2 border-card"></View>
              <SpotUsedBy />
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
            setBottomSheet(false), setSearch(''), setSelectedParking(undefined);
          }}
          snapPoints={[550]}>
          <BottomSheetView>
            <ContentSheetView className="h-full flex-col justify-between rounded-lg">
              <View className="gap-6">
                <View className="flex-col items-center gap-4 rounded-lg border border-border bg-background">
                  <TextInput
                    className="flex w-full justify-center rounded-lg p-4 text-base"
                    icon={'search'}
                    iconPosition="left"
                    iconSize={18}
                    editable={true}
                    value={search}
                    onChangeText={(text) => setSearch(text)}
                    placeholder="Rechercher un parking"
                    onPress={() => setSearch('')}
                  />
                </View>
                <View className="gap-3">
                  {parking &&
                    parking.slice(0, 2).map((parking) => (
                      <Pressable
                        key={parking.id}
                        onPress={() => {
                          setSelectedParking(parking),
                            setSearch(parking.address),
                            setCurrentSpotName('');
                        }}
                        className="min-h-16 min-w-60 flex-row items-center justify-between rounded-lg border border-border bg-card p-4">
                        <Text className="max-w-52">{parking.address}</Text>
                        <Text className="">{`${parking.spotsCount} ${parking.spotsCount > 1 ? 'spots' : 'spot'}`}</Text>
                      </Pressable>
                    ))}
                </View>
              </View>
              <View className="flex-col gap-4">
                <View className="w-full flex-row items-center">
                  <Text className="flex-1 text-lg">N° de place</Text>
                  <TextInput
                    className="flex-1 rounded-lg border border-border bg-background p-4"
                    icon={'pencil'}
                    iconPosition="right"
                    iconSize={18}
                    value={currentSpotName}
                    editable={true}
                    onChangeText={(text) => setCurrentSpotName(text)}
                  />
                </View>
                <Button
                  className={`w-full rounded-lg bg-primary  ${!selectedParking || currentSpotName?.trim() === '' ? 'opacity-30' : ''}`}
                  disabled={!selectedParking || currentSpotName?.trim() === '' || isLoading}
                  onPress={() => updateParking()}
                  size={'lg'}>
                  <Text className="text-white">Enregistrer</Text>
                </Button>
              </View>
            </ContentSheetView>
          </BottomSheetView>
        </Sheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
