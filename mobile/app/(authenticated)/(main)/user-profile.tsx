import React, {
  createRef,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, Pressable, Share, View } from 'react-native';
import { useCurrentUser } from '~/authentication/UserProvider';
import { Text } from '~/components/nativewindui/Text';
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
import { useFetch, useLoading, useRefreshOnSuccess } from '~/lib/useFetch';
import { useDefineSpot } from '~/endpoints/parkings/define-spot';
import { Entypo, Feather, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '~/authentication/AuthProvider';
import { Card, CardContainer } from '~/components/Card';
import { TextInput as ReactTextInput } from 'react-native/Libraries/Components/TextInput/TextInput';
import { cn } from '~/lib/cn';
import { Title } from '~/components/Title';
import { useLogout } from '~/endpoints/me/logout';
import { ContentSheetView } from '~/components/ContentView';
import { Modal, ModalTitle } from '~/components/Modal';
import { useKeyboardVisible } from '~/lib/useKeyboardVisible';
import { useDeleteAccount } from '~/endpoints/me/delete-account';
import { Checkbox } from '~/components/Checkbox';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { getRandomInt, opacity } from '~/lib/utils';
import { ParkingResponse } from '~/endpoints/parkings/parking-response';
import { useCreateParking } from '~/endpoints/parkings/create-parking';
import { useEditParkingInfo } from '~/endpoints/parkings/edit-parking-info';
import { useDeleteParking } from '~/endpoints/parkings/delete-parking';
import { formatDistance } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Rating } from '~/components/Rating';
import { universalLink } from '~/endpoints/universalLink';
import { AppContext } from '~/app/_layout';
import { firebaseAuth } from '~/authentication/firebase';
import { useRouter } from 'expo-router';

export default function UserProfileScreen() {
  const { firebaseUser } = useAuth();
  const { colors } = useColorScheme();
  const { userProfile, updateUserProfile } = useCurrentUser();
  const { t } = useTranslation();
  const [currentDisplayName, setCurrentDisplayName] = useState(userProfile.displayName);
  const [bottomSheet, setBottomSheet] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmAccountDeletion, setConfirmAccountDeletion] = useState(false);

  const uploadPicture = useUploadUserPicture();

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

    await updateUserProfile({
      // make the link change to know it's been updated as the path is unchanged
      pictureUrl: `${readonlyUrl}#_n=${new Date().toISOString()}`,
      displayName: userProfile.displayName,
    });
  };

  const [displayNameDebounce] = useDebounce(currentDisplayName, 400);

  useEffect(() => {
    if (displayNameDebounce.length < 2) {
      return;
    }

    updateUserProfile({
      pictureUrl: firebaseUser?.photoURL,
      displayName: currentDisplayName,
    }).then();
  }, [displayNameDebounce]);

  function updateDisplayName() {
    firebaseUser.photoURL &&
      updateUserProfile({ pictureUrl: firebaseUser.photoURL, displayName: currentDisplayName });
  }

  return (
    <>
      <ScreenWithHeader>
        <View className="flex-row justify-between gap-6">
          <Pressable className={'relative mx-auto h-28 items-center'} onPress={pickImageAsync}>
            <View className="absolute bottom-0 right-0 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white shadow-md">
              <ThemedIcon name={'pencil'} size={16} />
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
              element: <ThemedIcon name={'pencil'} />,
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
          <Title action={<ShareSpot />}>{t('user.profile.mySpot')}</Title>

          <View className={'flex-col gap-2'}>
            <Pressable onPress={() => setBottomSheet(true)}>
              <Card className="flex-col items-start gap-3">
                <View className="w-full flex-row items-center justify-between">
                  <Text className="-mt-1 text-lg font-semibold text-foreground">
                    {userProfile.spot
                      ? t('common.spot.name', {
                          parking: userProfile.spot.parking.name,
                          number: userProfile.spot.name,
                        })
                      : t('user.profile.noParkingDefined')}
                  </Text>
                  <ThemedIcon name={'pencil'} />
                </View>
                <View className="w-full max-w-full flex-row items-center gap-4 break-words">
                  <ThemedIcon name={'location-dot'} component={FontAwesome6} />
                  <Text className="text-md w-10/12">
                    {userProfile.spot
                      ? userProfile.spot?.parking.address
                      : t('user.profile.noAddressDefined')}
                  </Text>
                </View>
              </Card>
            </Pressable>
          </View>
        </View>

        <BigSeparator />

        <Button
          variant={'plain'}
          onPress={() => setConfirmLogout(true)}
          size={'lg'}
          className={'bg-destructive/15'}>
          <ThemedIcon name={'logout'} component={MaterialIcons} color={colors.destructive} />
          <Text className={'text-destructive'}>{t('common.logout')}</Text>
        </Button>

        <Button variant={'plain'} onPress={() => setConfirmAccountDeletion(true)} size={'lg'}>
          <ThemedIcon name={'no-accounts'} component={MaterialIcons} color={colors.destructive} />
          <Text className={'text-destructive'}>{t('user.profile.deleteAccount')}</Text>
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

function ShareSpot() {
  const { t } = useTranslation();
  const { userProfile } = useCurrentUser();

  async function shareSpot(code: string) {
    await Share.share(
      {
        title: t('user.parking.share.title'),
        message: t('user.parking.share.message', { code: code }),
        url: universalLink(`join-parking?code=${code}`),
      },
      { dialogTitle: t('user.parking.share.title') }
    );
  }

  return (
    <Button
      variant={'primary'}
      size={'sm'}
      disabled={!userProfile.spot}
      onPress={() => userProfile.spot && shareSpot(userProfile.spot.parking.code)}>
      <ThemedIcon name={'share-2'} component={Feather} />
      <Text>{t('user.parking.share.button')}</Text>
    </Button>
  );
}

const BigSeparator = () => <View className={'mt-10'} />;

function AppVersionInfo() {
  const { t } = useTranslation();

  return (
    <View className={'flex-row items-center justify-center gap-4'}>
      <Text variant={'caption2'}>{Constants.expoConfig?.version ?? 'Unknown'}</Text>
      <Text variant={'caption2'}>-</Text>
      <Text variant={'caption2'}>
        {Updates.createdAt
          ? t('app.otaPatch', {
              time: formatDistance(Updates.createdAt, new Date(), { addSuffix: true }),
            })
          : t('app.noOtaPatch')}
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
  const { t } = useTranslation();

  async function deleteAccountBackendAndFirebase() {
    await deleteAccount();
    await firebaseUser.delete();
  }

  useEffect(() => {
    !visible && setUserHasConfirmed(false);
  }, [visible]);

  return (
    <>
      <Modal open={visible} onOpenChange={onVisibleChange} className={'bg-destructive/20'}>
        <ModalTitle
          text={t('user.profile.deleteAccountTitle')}
          icon={<ThemedIcon name={'warning'} />}
        />

        <View className={'mt-4 flex-col gap-8'}>
          <Text className={'text-destructive'} variant={'callout'}>
            {t('user.profile.deleteAccountConfirmation')}
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
            <Text variant={'caption1'}>{t('user.profile.deleteAccountConfirm')}</Text>
          </View>
        </View>

        <View className="mt-4 w-full flex-row justify-between gap-4">
          <Button
            className={'grow'}
            size={'lg'}
            variant="tonal"
            onPress={() => onVisibleChange(false)}>
            <Text className={'text-primary'}>{t('common.cancel')}</Text>
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
                color={colors.destructive}
              />
            )}
            <Text className={'text-destructive'}>{t('common.delete')}</Text>
          </Button>
        </View>
      </Modal>
      {children}
    </>
  );
}

export function LogoutConfirmationModal({
  children,
  onVisibleChange,
  visible,
}: PropsWithChildren<{
  visible: boolean;
  onVisibleChange: Dispatch<SetStateAction<boolean>>;
}>) {
  const [logout, loggingOut] = useLoading(useLogout());
  const { userDevice } = useContext(AppContext);
  const { colors } = useColorScheme();
  const { t } = useTranslation();

  const handleLogout = async () => {
    onVisibleChange(false);
    await logout({
      deviceId: userDevice.deviceId,
    });
    await firebaseAuth.signOut();
  };

  return (
    <>
      <Modal open={visible} onOpenChange={onVisibleChange}>
        <ModalTitle text={t('account.logoutConfirmation')} icon={<ThemedIcon name={'warning'} />} />
        <View className="mt-4 w-full flex-row justify-between gap-4">
          <Button
            className={'grow'}
            size={'lg'}
            variant="tonal"
            onPress={() => onVisibleChange(false)}>
            <Text className={'text-primary'}>{t('common.back')}</Text>
          </Button>
          <Button className={'grow'} variant={'plain'} size={'lg'} onPress={() => handleLogout()}>
            {loggingOut ? (
              <ActivityIndicator color={colors.destructive} />
            ) : (
              <ThemedIcon name={'logout'} component={MaterialIcons} color={colors.destructive} />
            )}
            <Text className={'text-destructive'}>{t('common.logout')}</Text>
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
  const { userProfile } = useCurrentUser();
  const [currentSpotName, setCurrentSpotName] = useState(userProfile.spot?.name);

  const { colors } = useColorScheme();
  const bottomSheetModalRef = useSheetRef();
  const { t } = useTranslation();

  const [search, setSearch] = useState<string>();
  const [searchFocused, setSearchFocused] = useState(false);
  const searchParking = useSearchParking();
  const [defineSpot, isUpdating] = useLoading(useRefreshOnSuccess(useDefineSpot()), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });

  const fullSearch = useMemo(
    () => search ?? userProfile.spot?.parking.address ?? '',
    [search, userProfile.spot?.parking.address]
  );
  const [searchDebounce] = useDebounce(fullSearch, 200);
  const [parking, setParking] = useFetch(() => searchParking(searchDebounce), [searchDebounce]);
  const [selectedParking, setSelectedParking] = useState<ParkingResponse>();
  const [editingParking, setEditingParking] = useState<ParkingResponse | null>(null);
  const [parkingModalOpen, setParkingModalOpen] = useState(false);
  const router = useRouter();

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

    await defineSpot({
      parkingId: selectedParking.id,
      lotName: currentSpotName,
    });
  }

  function selectParking(parking: ParkingResponse) {
    spotNameRef.current?.focus();
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

  function onParkingEdit(parking: ParkingResponse) {
    setEditingParking(parking);
    setParkingModalOpen(true);
  }

  const maximizeSpace = searchFocused && keyboardVisible;

  return (
    <Sheet
      ref={bottomSheetModalRef}
      enableDynamicSizing={false}
      onDismiss={() => props.onOpenChange(false)}
      snapPoints={keyboardVisible ? ['95%'] : ['80%']}>
      <ContentSheetView
        className={'flex-col justify-between gap-4'}
        style={
          keyboardVisible && {
            paddingBottom: keyboardHeight + 24,
          }
        }>
        <View className="grow flex-col gap-2">
          <TextInput
            icon={{
              position: 'left',
              element: <ThemedIcon name={'search'} />,
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            textContentType={'addressCityAndState'}
            editable={true}
            value={fullSearch}
            onChangeText={setSearch}
            onPress={() => setSearch('')}
            placeholder={t('user.parking.searchParking')}
          />

          <CardContainer className={'flex-1'}>
            {parking && parking.length > 0 ? (
              parking.map((parking) => (
                <ParkingCard
                  key={parking.id}
                  parking={parking}
                  isSelected={selectedParking?.id === parking.id}
                  onSelect={() => selectParking(parking)}
                  onEdit={() => onParkingEdit(parking)}
                />
              ))
            ) : (
              <Text className={'top-1/2 mx-auto text-center'}>
                {t('user.parking.noMatchingParking', { search })}
              </Text>
            )}
          </CardContainer>
        </View>

        {!maximizeSpace && (
          <Pressable onPress={initiateParkingCreation}>
            <Card className={'flex-row items-center justify-between'}>
              <Text variant={'footnote'} className={'w-2/3'}>
                {t('user.parking.cantFindParking')}
              </Text>
              <ThemedIcon name={'plus'} component={FontAwesome6} size={20} />
            </Card>
          </Pressable>
        )}

        {!maximizeSpace && (
          <Pressable onPress={() => router.replace('/join-parking')}>
            <Card className={'flex-row items-center justify-between'}>
              <Text variant={'footnote'} className={'w-2/3'}>
                {t('user.parking.searchWithCode')}
              </Text>
              <ThemedIcon name={'ticket'} component={FontAwesome6} size={20} />
            </Card>
          </Pressable>
        )}

        {!maximizeSpace && (
          <View className="flex-col gap-8">
            <View className="w-full flex-row items-center justify-between">
              <Text className="text-lg">{t('common.spot.numberLabel')}</Text>
              <TextInput
                ref={spotNameRef}
                className={'w-40'}
                icon={{
                  position: 'right',
                  element: <ThemedIcon name={'pencil'} />,
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
              <Text className="text-white">{t('common.save')}</Text>
            </Button>
          </View>
        )}
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

function ParkingCard(props: {
  isSelected: boolean;
  parking: ParkingResponse;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const { userProfile } = useCurrentUser();
  const { colors } = useColorScheme();

  const isOwned = props.parking.ownerId === userProfile.id;

  return (
    <Pressable onPress={props.onSelect}>
      <Card highlight={props.isSelected}>
        <View className={'flex-row items-center justify-between'}>
          <View className={'flex-row items-center'}>
            <Text className={'text-lg font-bold'}>{props.parking.name}</Text>
            {isOwned && (
              <Button
                variant={'plain'}
                onPress={(e) => {
                  e.stopPropagation();
                  props.onEdit();
                }}>
                <ThemedIcon name={'pencil'} color={colors.foreground} />
              </Button>
            )}
          </View>
          <View
            className={cn(
              'flex-row items-center gap-2',
              props.parking.spotsCount === 0 && 'opacity-70'
            )}>
            <Text className={'font-semibold'}>{props.parking.spotsCount}</Text>
            <ThemedIcon name={'user'} color={colors.card} />
          </View>
        </View>
        <View className="flex-row items-center justify-between gap-4">
          <View className={'w-4/5 flex-row items-center gap-4'}>
            <ThemedIcon name={'tag'} component={FontAwesome6} />
            <Text className="shrink text-sm">{props.parking.address}</Text>
          </View>
          {props.isSelected && <ThemedIcon name={'check'} color={colors.primary} />}
        </View>
      </Card>
    </Pressable>
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
  const { t } = useTranslation();

  const [createParking, isCreating] = useLoading(useCreateParking(), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });
  const [editParking, isEditing] = useLoading(useEditParkingInfo(), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });
  const [deleteParking, isDeleting] = useLoading(useDeleteParking(), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });

  useEffect(() => {
    setAddress(props.parking?.address ?? '');
    setName(
      props.parking?.name ?? t('user.profile.randomParking', { number: getRandomInt(100, 999) })
    );
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
    create: t('user.parking.create', { name }),
    edit: t('common.save'),
  };

  const titleText = {
    create: t('user.parking.createParking'),
    edit: t('user.parking.editParking'),
  };

  async function onSubmit() {
    const parking = await submitFn[mode]();
    parking && props.onParking(parking);
  }

  async function onDelete() {
    if (!props.parking) {
      return;
    }

    await deleteParking(props.parking.id);
    props.onDelete(props.parking);
  }

  return (
    <Modal open={props.open} onOpenChange={props.onOpenChange} className={'flex-col gap-6'}>
      <ModalTitle text={titleText[mode]} />
      <View className={'flex-col gap-2'}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('user.parking.parkingName')}
          maxLength={50}
        />
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder={t('user.parking.parkingAddress')}
          maxLength={100}
          icon={{
            element: <ThemedIcon name={'location-dot'} component={FontAwesome6} />,
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
                element: <ThemedIcon name={'trash'} color={colors.destructive} />,
              }}
            />
          )}
          <View className={cn(confirmedParkingName !== null && 'flex-row justify-between')}>
            {confirmedParkingName !== null && (
              <Button variant={'tonal'} onPress={() => setConfirmedParkingName(null)}>
                <Text>{t('user.parking.cancelDelete')}</Text>
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
              <Text className={'text-destructive'}>{t('user.parking.confirmDelete')}</Text>
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
