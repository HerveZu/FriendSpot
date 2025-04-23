import React, {
  createRef,
  Dispatch,
  PropsWithChildren,
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
import { useUploadUserPicture } from '~/endpoints/me/upload-user-picture';
import { useSearchParking } from '~/endpoints/parkings/search-parking';
import { useFetch, useLoading } from '~/lib/useFetch';
import { useDefineSpot } from '~/endpoints/parkings/define-spot';
import { Entypo, FontAwesome6, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '~/authentication/AuthProvider';
import { List } from '~/components/List';
import { Card } from '~/components/Card';
import { TextInput as ReactTextInput } from 'react-native/Libraries/Components/TextInput/TextInput';
import { cn } from '~/lib/cn';
import { useSendReview } from '~/endpoints/me/send-review';
import { Title } from '~/components/Title';
import { useLogout } from '~/endpoints/me/logout';
import { ContentSheetView } from '~/components/ContentView';
import { Modal, ModalTitle } from '~/components/Modal';
import { useDeviceId } from '~/lib/use-device-id';
import { useKeyboardVisible } from '~/lib/useKeyboardVisible';
import { useDeleteAccount } from '~/endpoints/me/delete-account';
import { Checkbox } from '~/components/Checkbox';
import { ScrollView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { getRandomInt, opacity } from '~/lib/utils';
import { ParkingResponse } from '~/endpoints/parkings/parking-response';
import { useCreateParking } from '~/endpoints/parkings/create-parking';
import { useEditParkingInfo } from '~/endpoints/parkings/edit-parking-info';
import { useDeleteParking } from '~/endpoints/parkings/delete-parking';
import { formatDistance } from 'date-fns';

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
                      ? `${userProfile.spot.parking.name} [n°${userProfile.spot.name}]`
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
  return (
    <View className={'flex-row items-center justify-center gap-4'}>
      <Text variant={'caption2'}>{Constants.expoConfig?.version ?? 'Unknown'}</Text>
      <Text variant={'caption2'}>-</Text>
      <Text variant={'caption2'}>
        {Updates.createdAt
          ? `Patch OTA appliqué ${formatDistance(Updates.createdAt, new Date(), { addSuffix: true })}`
          : 'Aucun patch OTA'}
      </Text>
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
  const [parking, setParking] = useFetch(() => searchParking(searchDebounce), [searchDebounce]);
  const [selectedParking, setSelectedParking] = useState<ParkingResponse>();
  const [editingParking, setEditingParking] = useState<ParkingResponse | null>(null);
  const [parkingModalOpen, setParkingModalOpen] = useState(false);

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

  function replaceParkingState(parking: ParkingResponse) {
    setParking((allParking) => [
      ...(allParking?.filter((p) => p.id !== parking.id) ?? []),
      parking,
    ]);
  }

  function deleteParkingState(parking: ParkingResponse) {
    setParking((allParking) => [...(allParking?.filter((p) => p.id !== parking.id) ?? [])]);
  }

  function initiateParkingCreation() {
    setParkingModalOpen(true);
    setEditingParking(null);
  }

  function ParkingCard(props: { parking: ParkingResponse }) {
    const isSelected = selectedParking?.id === props.parking.id;
    const isOwned = props.parking.ownerId === userProfile.id;

    function onEdit() {
      setEditingParking(props.parking);
      setParkingModalOpen(true);
    }

    return (
      <Pressable onPress={() => selectParking(props.parking)}>
        <Card>
          <View className={'flex-row items-center justify-between'}>
            <View className={'flex-row items-center'}>
              <Text className={'text-lg font-bold'}>{props.parking.name}</Text>
              {isOwned && (
                <Button
                  variant={'plain'}
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}>
                  <ThemedIcon name={'pencil'} size={18} color={colors.foreground} />
                </Button>
              )}
            </View>
            <View
              className={cn(
                'flex-row items-center gap-2',
                props.parking.spotsCount === 0 && 'opacity-70'
              )}>
              <Text className={'font-semibold'}>{props.parking.spotsCount}</Text>
              <ThemedIcon name={'car'} />
            </View>
          </View>
          <View className="flex-row items-center justify-between gap-4">
            <View className={'w-4/5 flex-row items-center gap-4'}>
              <ThemedIcon name={'location-dot'} component={FontAwesome6} size={18} />
              <Text className="shrink text-sm">{props.parking.address}</Text>
            </View>
            {isSelected && <ThemedIcon name={'check'} size={18} color={colors.primary} />}
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
      snapPoints={keyboardVisible ? [800] : [650]}>
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

          <ScrollView
            className={cn(
              'bg-background/40 max-h-72 rounded-xl p-2',
              keyboardVisible && 'max-h-48'
            )}>
            <List>
              {parking && parking.length > 0 ? (
                parking.map((parking) => <ParkingCard key={parking.id} parking={parking} />)
              ) : (
                <Text className={'top-1/2 mx-auto text-center'}>
                  Aucun parking ne correspond à «{search}».
                </Text>
              )}
            </List>
          </ScrollView>

          {!keyboardVisible && (
            <Pressable onPress={initiateParkingCreation}>
              <Card className={'flex-row items-center justify-between gap-4'}>
                <Text variant={'caption1'} className={'w-2/3'}>
                  Tu ne trouves pas ton parking ? Créé le maintenant !
                </Text>
                <ThemedIcon name={'location'} component={Entypo} size={24} />
              </Card>
            </Pressable>
          )}
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
      <ParkingModal
        parking={editingParking}
        open={parkingModalOpen}
        onOpenChange={setParkingModalOpen}
        onParking={replaceParkingState}
        onDelete={deleteParkingState}
      />
    </Sheet>
  );
}

function ParkingModal(props: {
  parking: ParkingResponse | null;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onParking: (parking: ParkingResponse) => void;
  onDelete: (parking: ParkingResponse) => void;
}) {
  const mode = props.parking ? 'edit' : 'create';
  const [address, setAddress] = useState(props.parking?.address ?? '');
  const [name, setName] = useState(props.parking?.name ?? '');
  const { colors } = useColorScheme();
  const [confirmedParkingName, setConfirmedParkingName] = useState<string | null>(null);

  const [createParking, isCreating] = useLoading(useCreateParking());
  const [editParking, isEditing] = useLoading(useEditParkingInfo());
  const [deleteParking, isDeleting] = useLoading(useDeleteParking());

  useEffect(() => {
    setAddress(props.parking?.address ?? '');
    setName(props.parking?.name ?? `Mon parking ${getRandomInt(100, 999)}`);
  }, [props.parking, props.open]);

  useEffect(() => {
    setConfirmedParkingName(null);
  }, [props.open]);

  const submitFn = {
    create: () => createParking({ name, address }),
    edit: () => (props.parking?.id ? editParking(props.parking.id, { name, address }) : undefined),
  };

  const isSubmitting = {
    create: isCreating,
    edit: isEditing,
  };

  const submitText = {
    create: `Créer ${name}`,
    edit: 'Enregistrer',
  };

  const titleText = {
    create: 'Créer un parking',
    edit: 'Modifier un parking',
  };

  async function onSubmit() {
    const parking = await submitFn[mode]();
    parking && props.onParking(parking);
    props.onOpenChange(false);
  }

  async function onDelete() {
    if (!props.parking) {
      return;
    }

    await deleteParking(props.parking.id);
    props.onDelete(props.parking);
    props.onOpenChange(false);
  }

  return (
    <Modal open={props.open} onOpenChange={props.onOpenChange} className={'flex-col gap-6'}>
      <ModalTitle text={titleText[mode]} />
      <View className={'flex-col gap-2'}>
        <TextInput value={name} onChangeText={setName} placeholder={'Mon parking'} maxLength={50} />
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder={'Chemin de mon parking'}
          maxLength={100}
          icon={{
            element: <ThemedIcon name={'location-dot'} component={FontAwesome6} size={18} />,
            position: 'left',
          }}
        />
      </View>

      {mode === 'edit' && (
        <>
          {confirmedParkingName !== null && (
            <TextInput
              style={{
                color: colors.destructive,
                borderColor: colors.destructive,
              }}
              placeholderTextColor={opacity(colors.destructive, 0.5)}
              placeholder={props.parking?.name}
              value={confirmedParkingName}
              onChangeText={setConfirmedParkingName}
              icon={{
                position: 'right',
                element: <ThemedIcon name={'trash'} color={colors.destructive} size={18} />,
              }}
            />
          )}
          <View className={cn(confirmedParkingName !== null && 'flex-row justify-between')}>
            {confirmedParkingName !== null && (
              <Button variant={'tonal'} onPress={() => setConfirmedParkingName(null)}>
                <Text>Annuler</Text>
              </Button>
            )}
            <Button
              disabled={
                confirmedParkingName !== null && confirmedParkingName !== props.parking?.name
              }
              variant={'plain'}
              onPress={() =>
                confirmedParkingName === null ? setConfirmedParkingName('') : onDelete()
              }>
              {isDeleting && <ActivityIndicator color={colors.destructive} />}
              <Text className={'text-destructive'}>Supprimer</Text>
            </Button>
          </View>
        </>
      )}

      <Button disabled={!name || !address || isSubmitting[mode]} onPress={onSubmit}>
        {isSubmitting[mode] && <ActivityIndicator color={colors.foreground} />}
        <Text>{submitText[mode]}</Text>
      </Button>
    </Modal>
  );
}
