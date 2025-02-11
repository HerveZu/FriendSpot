import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
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
import avatar2 from '../../assets/avatar-2.png';
import { useApiRequest } from '~/endpoints/use-api-request';
import { useDebounce } from 'use-debounce';
import { MeAvatar } from '~/components/UserAvatar';
import car from '../../assets/car-user-profil.png';
import * as ImagePicker from 'expo-image-picker';
import { LogoCard } from '~/components/Logo';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import mime from 'mime';

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
  const [value] = useDebounce(search, 400);
  const { userProfile, updateInternalProfile, refreshProfile } = useCurrentUser();
  const [currentDisplayName, setCurrentDisplayName] = useState<string>(userProfile.displayName);
  const [oldDisplayName, setOldDisplayName] = useState<string>(userProfile.displayName);
  const bottomSheetModalRef = useSheetRef();
  const [currentSpotName, setCurrentSpotName] = useState<string>(userProfile.spot?.name || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const storage = getStorage();
      const imageUri = result.assets[0].uri;
      const response = await fetch(imageUri);
      console.log(response);
      const blob = await response.blob();

      const extension = mime.getExtension(result.assets[0].type || '') || 'jpg';

      const userId = user?.uid;

      const photoUrlRef = ref(storage, `images/${userId}.${extension}`);

      await uploadBytes(photoUrlRef, blob);

      getDownloadURL(ref(photoUrlRef)).then((url) => {
        updateInternalProfile(url, userProfile.displayName);
      });
    } else {
      return;
    }
  };

  useEffect(() => {
    apiRequest<Parking[]>(`/parking?search=${value}`, 'GET').then(setParking);
  }, [value]);

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
    if (!userProfile?.spot?.available) {
      return (
        <View className="h-28 w-[105px] flex-1">
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
        <View className="h-40 w-32 flex-1 rounded-lg border-2 border-dashed border-primary"></View>
      );
    }
  };

  const SpotUsedBy = () => {
    const totalDuration = () => {
      const usingUntil = userProfile?.spot?.currentlyUsedBy?.usingUntil;
      if (usingUntil) {
        const now = new Date();
        const endTime = new Date(usingUntil);
        const diffInMilliseconds = endTime.getTime() - now.getTime();
        const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
        if (diffInMinutes > 60) {
          const diffInHours = Math.floor(diffInMinutes / 60);
          return diffInHours;
        } else {
          return diffInMinutes;
        }
      }
    };

    if (userProfile.spot?.currentlyUsedBy) {
      return (
        <View className="w-full flex-1 flex-col justify-center gap-6 border border-green-500">
          <Text className="text-center text-base font-bold">En cours d'utilisation</Text>
          <View className="flex flex-col gap-4">
            <View className="flex-row items-center gap-2">
              <Image
                className="h-6 w-6"
                // source={{ uri: userProfile.spot.currentlyUsedBy.pictureUrl }}
                source={avatar2}
              />
              <Text className="text-base">{userProfile.spot.currentlyUsedBy.displayName}</Text>
            </View>
          </View>

          <View className="mt-2 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2">
            <ThemedIcon name={'clock-o'} size={18} color={'white'} />
            {userProfile.spot?.currentlyUsedBy?.usingUntil && (
              <Text className="text-center text-sm text-white">
                {`Encore ${totalDuration()} minutes`}
              </Text>
            )}
          </View>
        </View>
      );
    } else {
      return (
        <View className="w-full flex-1 flex-col justify-center gap-6 border border-green-500">
          <Text className="text-center text-lg font-bold">{`${!userProfile.spot?.available ? 'Votre spot est libre' : 'Vous occupez votre place'}`}</Text>
          <View className="mt-2 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2">
            <ThemedIcon name={'clock-o'} size={18} color={'white'} />
            <Text className="text-center text-sm text-white">
              {`Encore ${userProfile.spot?.nextAvailability}`}
            </Text>
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}>
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

            {/* Car here */}
            <View className="border-border-red-500 mt-6 flex-row justify-center gap-4 rounded-lg border-4 border-card px-2 py-2">
              <View className="mb-2 h-full items-center">
                <DisplayCar />
                <Text className="item-center text-xl font-bold text-foreground">
                  {userProfile.spot ? userProfile.spot.name : ''}
                </Text>
              </View>
              <View className="my-auto h-44 rounded-lg border-2 border-card"></View>
              <SpotUsedBy />
            </View>
            {/* Car here */}

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
                <View className="flex-col items-center gap-4 rounded-lg border border-foreground">
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
                        className="min-h-16 min-w-60 flex-row items-center justify-between rounded-lg border border-foreground bg-card p-4">
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
                    className="flex-1 rounded-lg border border-foreground p-4"
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
