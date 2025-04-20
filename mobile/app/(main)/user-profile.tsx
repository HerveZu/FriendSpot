import React, {
  createRef,
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useCurrentUser } from '~/authentication/UserProvider';
import { deleteUser, getAuth, signOut } from 'firebase/auth';
import { Text } from '~/components/nativewindui/Text';
import { Rating } from '~/components/Rating';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import { ThemedIcon } from '~/components/ThemedIcon';
import { TextInput } from '~/components/TextInput';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { useDebounce } from 'use-debounce';
import { MeAvatar } from '~/components/UserAvatar';
import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import * as ImagePicker from 'expo-image-picker';
import { useUploadUserPicture } from '~/endpoints/upload-user-picture';
import { ParkingResponse, useSearchParking } from '~/endpoints/search-parking';
import { useFetch, useLoading } from '~/lib/useFetch';
import { useDefineSpot } from '~/endpoints/define-spot';
import { FontAwesome6, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '~/authentication/AuthProvider';
import { List } from '~/components/List';
import { Card } from '~/components/Card';
import { TextInput as ReactTextInput } from 'react-native/Libraries/Components/TextInput/TextInput';
import { cn } from '~/lib/cn';
import { useSendReview } from '~/endpoints/send-review';
import { Title } from '~/components/Title';
import { useLogout } from '~/endpoints/logout';
import { ContentSheetView } from '~/components/ContentView';
import { Modal, ModalTitle } from '~/components/Modal';
import { useDeviceId } from '~/lib/use-device-id';
import { useKeyboardVisible } from '~/lib/useKeyboardVisible';
import { useDeleteAccount } from '~/endpoints/delete-account';
import { Checkbox } from '~/components/Checkbox';
import { ScrollView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';

export default function UserProfileScreen() {
  const { firebaseUser } = useAuth();
  const { colors } = useColorScheme();
  const { userProfile, updateInternalProfile } = useCurrentUser();
  const [currentDisplayName, setCurrentDisplayName] = useState(userProfile.displayName);
  const [bottomSheet, setBottomSheet] = useState(false);
  const [review, setReview] = useState<string>();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmAccountDeletion, setConfirmAccountDeletion] = useState(false);

  const uploadPicture = useUploadUserPicture();
  const sendReview = useSendReview();

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
    <>
      <ScreenWithHeader>
        <View className="flex-row justify-between gap-6">
          <Pressable className={'relative h-28'} onPress={pickImageAsync}>
            <View
              className="absolute bottom-0 right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary"
              accessibilityLabel="Edit Avatar">
              <ThemedIcon name={'pencil'} size={14} />
            </View>
            <MeAvatar className="h-28 w-28" fontSize={32} />
          </Pressable>
          <View className="w-3/5 shrink gap-4">
            <ScreenTitle wallet={false} title={userProfile.displayName} className={'mb-0'}>
              <Rating displayRating rating={userProfile.rating} stars={3} color={colors.primary} />
            </ScreenTitle>
          </View>
        </View>

        <View className={'gap-2'}>
          <TextInput
            icon={{
              position: 'right',
              element: <ThemedIcon size={18} name={'pencil'} />,
            }}
            maxLength={30}
            value={currentDisplayName}
            editable={true}
            onChangeText={(text) => setCurrentDisplayName(text)}
            onEndEditing={updateDisplayName}
          />
          <TextInput value={firebaseUser.email ?? ''} readOnly />
        </View>

        <View className={'flex-col'}>
          <Title>Mon spot</Title>
          <View className={'flex-col gap-2'}>
            <Pressable onPress={() => setBottomSheet(true)}>
              <Card className="flex-col items-start gap-3">
                <View className="w-full flex-row items-center justify-between">
                  <Text className="-mt-1 text-lg font-semibold text-foreground">
                    {userProfile.spot
                      ? userProfile.spot.parking.name
                      : 'Aucun nom de parking de défini'}
                  </Text>
                  <ThemedIcon name={'pencil'} size={18} />
                </View>
                <View className="w-full max-w-full flex-row items-center gap-4 break-words">
                  <ThemedIcon name={'location-dot'} component={FontAwesome6} size={18} />
                  <Text className="text-md w-10/12">
                    {userProfile.spot
                      ? userProfile.spot?.parking.address
                      : 'Aucune adresse parking définie'}
                  </Text>
                </View>
              </Card>
            </Pressable>
          </View>
        </View>
        <View className={'flex-col'}>
          <Title>Autre</Title>
          <View className={'flex-col gap-2'}>
            <TextInput
              value={review}
              onChangeText={setReview}
              className={'w-full'}
              placeholder={'Tu as une suggestion ? Écris-nous ici !'}
            />
            <Button
              disabled={!review}
              variant={'tonal'}
              onPress={() => {
                review && sendReview(review);
                setReview(undefined);
              }}>
              <ThemedIcon
                name={'lightbulb-on-outline'}
                component={MaterialCommunityIcons}
                size={18}
                color={colors.primary}
              />
              <Text>Faire un retour</Text>
            </Button>
          </View>
        </View>

        <BigSeparator />

        <Button
          variant={'plain'}
          onPress={() => setConfirmLogout(true)}
          size={'lg'}
          className={'bg-destructive/15'}>
          <ThemedIcon
            name={'logout'}
            component={MaterialIcons}
            size={18}
            color={colors.destructive}
          />
          <Text className={'text-destructive'}>Se déconnecter</Text>
        </Button>

        <Button variant={'plain'} onPress={() => setConfirmAccountDeletion(true)} size={'lg'}>
          <ThemedIcon
            name={'no-accounts'}
            component={MaterialIcons}
            size={18}
            color={colors.destructive}
          />
          <Text className={'text-destructive'}>Supprimer mon compte</Text>
        </Button>

        <BigSeparator />

        <AppVersionInfo />
      </ScreenWithHeader>
      <LogoutConfirmationModal visible={confirmLogout} onVisibleChange={setConfirmLogout} />
      <AccountDeletionConfirmationModal
        visible={confirmAccountDeletion}
        onVisibleChange={setConfirmAccountDeletion}
      />
      <DefineSpotSheet open={bottomSheet} onOpenChange={setBottomSheet} />
    </>
  );
}

const BigSeparator = () => <View className={'mt-10'} />;

function AppVersionInfo() {
  const appVersion = Constants.expoConfig?.version || 'Unknown';
  const updateId = Constants.updateId || 'No OTA Update Applied';
  const updateChannel = Constants.updateChannel || 'default';

  function InfoRow(props: { label: string; value: ReactNode }) {
    return (
      <View className={'flex-row justify-between'}>
        <Text variant={'footnote'}>{props.label}</Text>
        <Text variant={'caption2'}>{props.value}</Text>
      </View>
    );
  }

  return (
    <View className={'flex-col gap-1'}>
      <InfoRow label={'App Version'} value={appVersion} />
      <InfoRow label={'Update ID'} value={updateId} />
      <InfoRow label={'Update Channel'} value={updateChannel} />
    </View>
  );
}

export function AccountDeletionConfirmationModal({
  children,
  visible,
  onVisibleChange,
}: PropsWithChildren<{
  visible: boolean;
  onVisibleChange: Dispatch<SetStateAction<boolean>>;
}>) {
  const [deleteAccount, deletingAccount] = useLoading(useDeleteAccount());
  const { colors } = useColorScheme();
  const [userHasConfirmed, setUserHasConfirmed] = useState(false);
  const { firebaseUser } = useAuth();
  const auth = getAuth();

  function deleteAccountBackendAndFirebase() {
    deleteAccount().then(() => deleteUser(firebaseUser).then(() => signOut(auth)));
  }

  useEffect(() => {
    !visible && setUserHasConfirmed(false);
  }, [visible]);

  return (
    <>
      <Modal open={visible} onOpenChange={onVisibleChange} className={'bg-destructive/20'}>
        <ModalTitle
          text={'Supprimer mon compte'}
          icon={<ThemedIcon name={'warning'} size={18} />}
        />

        <View className={'mt-4 flex-col gap-8'}>
          <Text className={'text-destructive'} variant={'callout'}>
            Supprimer mon compte et ses données associées. La suppresion se fera une fois que toutes
            les réservations de ton spot en cours seront terminées.
          </Text>

          <View className={'flex-row items-center gap-4'}>
            <Checkbox
              value={userHasConfirmed}
              onValueChange={setUserHasConfirmed}
              style={{
                borderColor: colors.foreground,
                borderRadius: 6,
              }}
            />
            <Text variant={'caption1'}>
              Je confirme vouloir supprimer mon compte et je comprends que cette action est
              irreversible.
            </Text>
          </View>
        </View>

        <View className="mt-4 w-full flex-row justify-between gap-4">
          <Button
            className={'grow'}
            size={'lg'}
            variant="tonal"
            onPress={() => onVisibleChange(false)}>
            <Text className={'text-primary'}>Annuler</Text>
          </Button>
          <Button
            disabled={!userHasConfirmed}
            className={'grow'}
            variant={'plain'}
            size={'lg'}
            onPress={deleteAccountBackendAndFirebase}>
            {deletingAccount ? (
              <ActivityIndicator color={colors.destructive} />
            ) : (
              <ThemedIcon
                name={'no-accounts'}
                component={MaterialIcons}
                size={18}
                color={colors.destructive}
              />
            )}
            <Text className={'text-destructive'}>Supprimer</Text>
          </Button>
        </View>
      </Modal>
      {children}
    </>
  );
}

export function LogoutConfirmationModal({
  children,
  visible,
  onVisibleChange,
}: PropsWithChildren<{
  visible: boolean;
  onVisibleChange: Dispatch<SetStateAction<boolean>>;
}>) {
  const [logout, loggingOut] = useLoading(useLogout());
  const { deviceId } = useDeviceId();
  const auth = getAuth();
  const { colors } = useColorScheme();

  const handleLogout = async () => {
    if (!deviceId) {
      return;
    }

    await logout({
      deviceId: deviceId,
    });
    await signOut(auth);
    onVisibleChange(false);
  };

  return (
    <>
      <Modal open={visible} onOpenChange={onVisibleChange}>
        <ModalTitle text={'Se déconnecter'} icon={<ThemedIcon name={'warning'} size={18} />} />
        <View className="mt-4 w-full flex-row justify-between gap-4">
          <Button
            className={'grow'}
            size={'lg'}
            variant="tonal"
            onPress={() => onVisibleChange(false)}>
            <Text className={'text-primary'}>Retour</Text>
          </Button>
          <Button className={'grow'} variant={'plain'} size={'lg'} onPress={() => handleLogout()}>
            {loggingOut ? (
              <ActivityIndicator color={colors.destructive} />
            ) : (
              <ThemedIcon
                name={'logout'}
                component={MaterialIcons}
                size={18}
                color={colors.destructive}
              />
            )}
            <Text className={'text-destructive'}>Se déconnecter</Text>
          </Button>
        </View>
      </Modal>
      {children}
    </>
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
  const { keyboardVisible, keyboardHeight } = useKeyboardVisible();

  // force open when no spot defined
  useEffect(() => {
    !userProfile.spot && props.onOpenChange(true);
  }, [userProfile.spot]);

  useEffect(() => {
    if (props.open) {
      parking &&
        setSelectedParking(parking.find((parking) => parking.id === userProfile.spot?.parking.id));
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
      setSearch(undefined);
      setCurrentSpotName(userProfile.spot?.name);
    }
  }, [props.open]);

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

  function selectParking(parking: ParkingResponse) {
    spotNameRef.current?.focus();
    setSearch(parking.address);
    setSelectedParking(parking);
    setCurrentSpotName('');
  }

  function ParkingCard(props: { parking: ParkingResponse }) {
    const isSelected = selectedParking?.id === props.parking.id;

    return (
      <Pressable onPress={() => selectParking(props.parking)}>
        <Card background>
          <View className={'flex-row items-center justify-between'}>
            <Text className={'text-lg font-bold'}>{props.parking.name}</Text>
            <Text
              className={
                'font-semibold'
              }>{`${props.parking.spotsCount} ${props.parking.spotsCount > 1 ? 'spots' : 'spot'}`}</Text>
          </View>
          <View className="flex-row items-center justify-between gap-4">
            <ThemedIcon name={'location-dot'} component={FontAwesome6} size={18} />
            <Text className="shrink text-sm">{props.parking.address}</Text>
            <View className={'w-8'}>
              {isSelected && <ThemedIcon name={'check'} size={18} color={colors.primary} />}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Sheet
      ref={bottomSheetModalRef}
      enableDynamicSizing={false}
      onDismiss={() => props.onOpenChange(false)}
      snapPoints={keyboardVisible ? [800] : [550]}>
      <ContentSheetView
        className={'flex-col justify-between gap-6'}
        style={
          keyboardVisible && {
            paddingBottom: keyboardHeight + 24,
          }
        }>
        <View className="grow flex-col gap-4">
          <TextInput
            icon={{
              position: 'left',
              element: <ThemedIcon size={18} name={'search'} />,
            }}
            textContentType={'addressCityAndState'}
            editable={true}
            value={fullSearch}
            onChangeText={(text) => setSearch(text)}
            onPress={() => setSearch('')}
            placeholder="Rechercher un parking"
          />

          <ScrollView className={cn('rounded-xl bg-card p-2', keyboardVisible && 'max-h-48')}>
            <List>
              {parking && parking.length > 0 ? (
                parking.map((parking) => <ParkingCard key={parking.id} parking={parking} />)
              ) : (
                <Text className={'top-1/2 mx-auto text-center'}>
                  Aucun parking ne correspond à la recherche.
                </Text>
              )}
            </List>
          </ScrollView>
        </View>
        <View className="flex-col gap-8">
          <View className="w-full flex-row items-center justify-between">
            <Text className="text-lg">N° de place</Text>
            <TextInput
              ref={spotNameRef}
              className={'w-40'}
              icon={{
                position: 'right',
                element: <ThemedIcon size={18} name={'pencil'} />,
              }}
              value={currentSpotName}
              editable={true}
              onChangeText={setCurrentSpotName}
            />
          </View>
          <Button
            className={`w-full rounded-xl bg-primary`}
            disabled={!selectedParking || !currentSpotName || isUpdating}
            onPress={() => updateParking()}
            size={'lg'}>
            {isUpdating && <ActivityIndicator color={colors.foreground} />}
            <Text className="text-white">Enregistrer</Text>
          </Button>
        </View>
      </ContentSheetView>
    </Sheet>
  );
}
