import React, { createRef, Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useCurrentUser } from '~/authentication/UserProvider';
import { getAuth, signOut } from 'firebase/auth';
import { ContentSheetView } from '~/components/ContentView';
import { Text } from '~/components/nativewindui/Text';
import { Rating } from '~/components/Rating';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import { ThemedIcon } from '~/components/ThemedIcon';
import { TextInput } from '~/components/TextInput';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { useDebounce } from 'use-debounce';
import { MeAvatar, UserAvatar } from '~/components/UserAvatar';
import car from '~/assets/car-user-profile.png';
import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import * as ImagePicker from 'expo-image-picker';
import { useActualTime } from '~/lib/useActualTime';
import { formatDuration, formatRelative, intervalToDuration } from 'date-fns';
import { useUploadUserPicture } from '~/endpoints/upload-user-picture';
import { ParkingResponse, useSearchParking } from '~/endpoints/search-parking';
import { useFetch } from '~/lib/useFetch';
import { useDefineSpot } from '~/endpoints/define-spot';
import { UserSpot } from '~/endpoints/get-profile';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '~/authentication/AuthProvider';
import { List } from '~/components/List';
import { Card } from '~/components/Card';
import { TextInput as ReactTextInput } from 'react-native/Libraries/Components/TextInput/TextInput';
import { cn } from '~/lib/cn';
import { useSendReview } from '~/endpoints/send-review';
import { Title } from '~/components/Title';
import { useNotification } from '~/context/NotificationContext';
import * as Notifications from 'expo-notifications';

export default function UserProfileScreen() {
  const { firebaseUser } = useAuth();
  const { colors } = useColorScheme();
  const { userProfile, updateInternalProfile } = useCurrentUser();
  const [currentDisplayName, setCurrentDisplayName] = useState(userProfile.displayName);
  const [bottomSheet, setBottomSheet] = useState(false);
  const [review, setReview] = React.useState<string>();

  const { expoPushToken, notification, error } = useNotification();

  if (error) {
    return <View>{error.message}</View>;
  }
  console.log(JSON.stringify(notification, null, 2));

  const uploadPicture = useUploadUserPicture();
  const sendReview = useSendReview();

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
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

  const [displayNameDebounce] = useDebounce(currentDisplayName, 400);

  useEffect(() => {
    updateInternalProfile(firebaseUser?.photoURL, currentDisplayName).then();
  }, [displayNameDebounce]);

  function updateDisplayName() {
    firebaseUser.photoURL && updateInternalProfile(firebaseUser.photoURL, currentDisplayName);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={65}>
      <ScreenWithHeader className="flex-col gap-16">
        <View className="flex-row justify-between gap-6">
          <Pressable className={'relative h-28'} onPress={pickImageAsync}>
            <View
              className="absolute bottom-0 right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary"
              accessibilityLabel="Edit Avatar">
              <ThemedIcon name={'pencil'} size={14} />
            </View>
            <MeAvatar className="h-28 w-28" />
          </Pressable>
          <View className="w-3/5 shrink gap-4">
            <ScreenTitle wallet={false} title={currentDisplayName} />
            <View className={'flex-row items-center justify-between'}>
              <Rating rating={userProfile.rating} stars={3} color={colors.primary} />
            </View>
          </View>
        </View>

        <View className={'gap-4'}>
          <TextInput
            icon={{
              position: 'right',
              element: <ThemedIcon size={18} name={'pencil'} />,
            }}
            value={currentDisplayName}
            editable={true}
            onChangeText={(text) => setCurrentDisplayName(text)}
            onEndEditing={updateDisplayName}
          />
          <TextInput value={firebaseUser.email ?? ''} readOnly />
        </View>

        <View className={'flex-col gap-6'}>
          <Title>Mon spot</Title>
          <Pressable
            className="flex-col items-start gap-3 rounded-lg bg-card p-3"
            onPress={() => setBottomSheet(true)}>
            <View className="w-full flex-row items-center justify-between">
              <Text className="text-xl font-semibold text-foreground">
                {userProfile.spot
                  ? userProfile.spot.parking.name
                  : 'Aucun nom de parking de défini'}
              </Text>
              <ThemedIcon name={'pencil'} size={18} />
            </View>
            <View className="w-full max-w-full flex-row items-center gap-4 break-words">
              <ThemedIcon name={'location-dot'} component={FontAwesome6} size={24} />
              <Text className="w-10/12 text-lg">
                {userProfile.spot
                  ? userProfile.spot?.parking.address
                  : 'Aucune adresse parking définie'}
              </Text>
            </View>
          </Pressable>

          {userProfile.spot && <UserSpotInfo spot={userProfile.spot} />}
        </View>

        <View className={'mb-4 flex-col gap-6'}>
          <Title>Autres</Title>
          <TextInput
            value={review}
            onChangeText={setReview}
            multiline
            className={'h-32 w-full'}
            placeholder={'Tu as une suggestion ? Écris-nous ici !'}
          />
          <Button
            disabled={!review}
            variant={'tonal'}
            size={'lg'}
            onPress={() => {
              review && sendReview(review);
              setReview(undefined);
            }}>
            <ThemedIcon
              name={'feedback'}
              component={MaterialIcons}
              size={24}
              color={colors.primary}
            />
            <Text>Faire un retour</Text>
          </Button>

          <Button variant={'plain'} onPress={() => handleLogout()}>
            <ThemedIcon
              name={'logout'}
              component={MaterialIcons}
              size={18}
              color={colors.destructive}
            />
            <Text className={'text-destructive'}>Se déconnecter</Text>
          </Button>
        </View>
      </ScreenWithHeader>
      <DefineSpotSheet open={bottomSheet} onOpenChange={setBottomSheet} />
    </KeyboardAvoidingView>
  );
}

function UserSpotInfo({ spot }: { spot: UserSpot }) {
  const now = useActualTime(30_000);

  const DisplayCar = () => {
    const busy = !spot.currentlyAvailable || spot.currentlyUsedBy;

    return (
      <View
        className={cn(
          'relative h-44 w-28 flex-col justify-end gap-4 rounded-lg bg-background',
          !busy && 'border-2 border-dashed border-primary'
        )}>
        {busy && (
          <>
            {!!spot.currentlyUsedBy && (
              <UserAvatar
                displayName={spot.currentlyUsedBy.displayName}
                pictureUrl={spot.currentlyUsedBy.pictureUrl}
                className="absolute left-[-5] top-[-5] z-10 h-8 w-8"
              />
            )}
            <Image
              className="my-auto mt-2 h-28 w-full"
              source={car}
              alt="car"
              style={{ transform: [{ rotate: '90deg' }], resizeMode: 'contain' }}
            />
          </>
        )}
        <Text className="mx-auto my-2 text-xl font-bold">{spot.name}</Text>
      </View>
    );
  };

  const SpotUsedBy = () => {
    return (
      <View className="w-full flex-1 flex-col items-center justify-center gap-6">
        <Text className="text-center text-xl font-semibold">
          {spot.currentlyUsedBy
            ? `En cours d'utilisation par ${spot.currentlyUsedBy.displayName}`
            : `${spot.currentlyAvailable ? 'Ton spot est libre' : 'Tu occupes ta place'}`}
        </Text>
        {(spot.currentlyUsedBy || spot.nextUse) && (
          <Text className="text-center">
            {spot.currentlyUsedBy
              ? spot.currentlyUsedBy.usingUntil &&
                `Pendant ${formatDuration(intervalToDuration({ start: now, end: spot.currentlyUsedBy.usingUntil }), { format: ['days', 'hours', 'minutes'] })}`
              : spot.nextUse && `Jusqu'à ${formatRelative(spot.nextUse, now)}`}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-row items-center justify-between gap-4 rounded-xl bg-card p-3">
      <DisplayCar />
      <SpotUsedBy />
    </View>
  );
}

function DefineSpotSheet(props: {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
  const { userProfile, refreshProfile } = useCurrentUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentSpotName, setCurrentSpotName] = useState(userProfile.spot?.name);

  const { colors } = useColorScheme();
  const bottomSheetModalRef = useSheetRef();

  const [search, setSearch] = useState<string>();
  const searchParking = useSearchParking();
  const defineSpot = useDefineSpot();

  const fullSearch = search ?? userProfile.spot?.parking.address ?? '';
  const [searchDebounce] = useDebounce(fullSearch, 200);
  const [parking] = useFetch(() => searchParking(searchDebounce), [searchDebounce]);
  const [selectedParking, setSelectedParking] = useState<ParkingResponse>();

  const spotNameRef = createRef<ReactTextInput>();

  useEffect(() => {
    !userProfile.spot && props.onOpenChange(true);
  }, [userProfile.spot]);

  useEffect(() => {
    if (!selectedParking) {
      return;
    }

    setSearch(selectedParking.address);
  }, [selectedParking]);

  useEffect(() => {
    if (props.open) {
      bottomSheetModalRef.current?.present();
    } else {
      setSearch(undefined);
      setSelectedParking(undefined);
      bottomSheetModalRef.current?.dismiss();
    }
  }, [bottomSheetModalRef.current, props.open]);

  async function updateParking() {
    if (!selectedParking || !currentSpotName) {
      return;
    }

    setIsUpdating(true);

    defineSpot({
      parkingId: selectedParking.id,
      lotName: currentSpotName,
    })
      .then(refreshProfile)
      .then(() => props.onOpenChange(false))
      .finally(() => setIsUpdating(false));
  }

  const triggerNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hello!',
        body: 'This is a test notification.',
        data: { data: 'goes here' },
      },
      trigger: null,
    });
  };

  return (
    <Sheet
      ref={bottomSheetModalRef}
      enableDynamicSizing={false}
      onDismiss={() => props.onOpenChange(false)}
      snapPoints={[550]}>
      <ContentSheetView className={'flex-col justify-between'}>
        <View className="gap-6">
          <TextInput
            icon={{
              position: 'left',
              element: <ThemedIcon size={18} name={'search'} />,
            }}
            editable={true}
            value={fullSearch}
            onChangeText={(text) => setSearch(text)}
            placeholder="Rechercher un parking"
          />
          <List>
            {parking &&
              parking.map((parking) => (
                <Pressable
                  key={parking.id}
                  onPress={() => {
                    setCurrentSpotName('');
                    spotNameRef.current?.focus();
                    setSelectedParking(parking);
                  }}>
                  <Card className="flex-row items-center justify-between bg-background">
                    <View className={'w-4'}>
                      {selectedParking?.id === parking.id ? (
                        <ThemedIcon name={'check'} size={18} color={colors.primary} />
                      ) : (
                        <ThemedIcon name={'location-dot'} component={FontAwesome6} size={18} />
                      )}
                    </View>

                    <Text className="w-2/3">{parking.address}</Text>
                    <Text>{`${parking.spotsCount} ${parking.spotsCount > 1 ? 'spots' : 'spot'}`}</Text>
                  </Card>
                </Pressable>
              ))}
          </List>
        </View>
        <View className="flex-col gap-8">
          <View className="w-full flex-row items-center justify-between">
            <Text className="text-xl font-bold">N° de place</Text>
            <TextInput
              ref={spotNameRef}
              className={'w-40'}
              icon={{
                position: 'right',
                element: <ThemedIcon size={18} name={'pencil'} />,
              }}
              value={currentSpotName}
              editable={true}
              onChangeText={(text) => setCurrentSpotName(text)}
            />
          </View>
          <Button
            className={`w-full rounded-xl bg-primary  ${!selectedParking || currentSpotName?.trim() === '' ? 'opacity-30' : ''}`}
            disabled={!selectedParking || !currentSpotName || isUpdating}
            onPress={() => {
              updateParking(), triggerNotification();
            }}
            size={'lg'}>
            <Text className="text-white">Enregistrer</Text>
          </Button>
        </View>
      </ContentSheetView>
    </Sheet>
  );
}
