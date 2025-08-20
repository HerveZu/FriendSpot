import React, {
  createRef,
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  TextInput as ReactTextInput,
  View,
} from 'react-native';
import { useCurrentUser } from '~/authentication/UserProvider';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import { ThemedIcon } from '~/components/ThemedIcon';
import { TextInput } from '~/components/TextInput';
import { Sheet } from '~/components/nativewindui/Sheet';
import { useDebounce } from 'use-debounce';
import { MeAvatar } from '~/components/UserAvatar';
import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import * as ImagePicker from 'expo-image-picker';
import { useUploadUserPicture } from '~/endpoints/me/upload-user-picture';
import { useFetch, useLoading, useRefreshOnSuccess } from '~/lib/useFetch';
import { FontAwesome6, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '~/authentication/AuthProvider';
import { Card, CardContainer } from '~/components/Card';
import { cn } from '~/lib/cn';
import { SheetTitle, Title } from '~/components/Title';
import { useLogout } from '~/endpoints/me/logout';
import { ContentSheetView } from '~/components/ContentView';
import { Modal, ModalTitle } from '~/components/Modal';
import { useDeleteAccount } from '~/endpoints/me/delete-account';
import { Checkbox } from '~/components/Checkbox';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { opacity } from '~/lib/utils';
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
import CautionIllustration from '~/assets/caution.svg';
import { useLeaveSpot } from '~/endpoints/parkings/leave-spot';
import { ExpandItem, ExpandRow } from '~/components/ExpandItem';
import { useSheetRefWithState } from '~/lib/useSheetRefWithState';
import { useSearchParking } from '~/endpoints/parkings/search-parking';
import { useDefineSpot } from '~/endpoints/parkings/define-spot';
import { useKeyboardVisible } from '~/lib/useKeyboardVisible';
import { ParkingSpotCount } from '~/components/ParkingSpotCount';

export default function UserProfileScreen() {
  const { firebaseUser } = useAuth();
  const { colors } = useColorScheme();
  const { userProfile, updateUserProfile } = useCurrentUser();
  const { t } = useTranslation();
  const [currentDisplayName, setCurrentDisplayName] = useState(userProfile.displayName);
  const [parkingBottomSheetOpen, setParkingBottomSheetOpen] = useState(false);
  const [parameterSheetOpen, setParameterSheetOpen] = useState(false);

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
        <View className={'flex-col gap-2'}>
          <Title
            action={<ShareSpot />}
            icon={{
              element: (
                <ThemedIcon name={'user-group'} component={FontAwesome6} color={colors.primary} />
              ),
            }}>
            {t('user.profile.mySpot')}
          </Title>
          <Pressable
            onPress={() => setParkingBottomSheetOpen(true)}
            className={cn('rounded-xl border', !userProfile.spot && 'bg-destructive/60')}>
            <Card className="flex-col items-start gap-3">
              <View className="flex-1 flex-row items-center justify-between">
                {!userProfile.spot ? (
                  <View className="flex flex-row items-center justify-center gap-2">
                    <ThemedIcon
                      name="xmark"
                      component={FontAwesome6}
                      color={colors.destructive}
                      size={20}
                    />
                    <Text className="text-base font-semibold">
                      {t('user.profile.noParkingDefined')}
                    </Text>
                  </View>
                ) : (
                  <Text numberOfLines={2} ellipsizeMode={'tail'}>
                    {t('common.spot.name', {
                      parking: userProfile.spot.parking.name,
                      number: userProfile.spot.name,
                    })}
                  </Text>
                )}
              </View>
            </Card>
          </Pressable>
        </View>
        <View className={'flex-col'}>
          <Title
            icon={{
              element: (
                <ThemedIcon
                  name={'gear'}
                  component={FontAwesome6}
                  color={colors.primary}
                  size={20}
                />
              ),
            }}>
            {t('user.profile.parameter.title')}
          </Title>
          <Pressable onPress={() => setParameterSheetOpen(true)}>
            <Card className="flex-col items-start gap-3">
              <View className="w-full flex-row items-center justify-between">
                <Text>{t('user.profile.parameter.cardTitle')}</Text>
              </View>
            </Card>
          </Pressable>
        </View>
      </ScreenWithHeader>
      <ParkingBottomSheet open={parkingBottomSheetOpen} onOpenChange={setParkingBottomSheetOpen} />
      <SettingsBottomSheet open={parameterSheetOpen} onOpenChange={setParameterSheetOpen} />
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
      <ThemedIcon name={'share'} component={FontAwesome6} />
      <Text>{t('user.parking.share.button')}</Text>
    </Button>
  );
}

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
    await firebaseUser.delete().catch((e) => {
      console.error(e);
      // we need to do a recent sign-in to be able to delete the account on firebase
      firebaseAuth.signOut();
    });
  }

  useEffect(() => {
    !visible && setUserHasConfirmed(false);
  }, [visible]);

  return (
    <>
      <Modal open={visible} onOpenChange={onVisibleChange} className={'bg-destructive/20 gap-4'}>
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

        <ExpandRow className="mt-4">
          <ExpandItem>
            <Button size={'lg'} variant="tonal" onPress={() => onVisibleChange(false)}>
              <Text className={'text-primary'}>{t('common.cancel')}</Text>
            </Button>
          </ExpandItem>
          <ExpandItem>
            <Button
              disabled={!userHasConfirmed}
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
          </ExpandItem>
        </ExpandRow>
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
        <ModalTitle
          text={t('user.profile.logoutConfirmation')}
          icon={<ThemedIcon name={'warning'} />}
        />
        <ExpandRow className="mt-4">
          <ExpandItem>
            <Button size={'lg'} variant="tonal" onPress={() => onVisibleChange(false)}>
              <Text className={'text-primary'}>{t('common.back')}</Text>
            </Button>
          </ExpandItem>
          <ExpandItem>
            <Button variant={'plain'} size={'lg'} onPress={() => handleLogout()}>
              {loggingOut ? (
                <ActivityIndicator color={colors.destructive} />
              ) : (
                <ThemedIcon name={'logout'} component={MaterialIcons} color={colors.destructive} />
              )}
              <Text className={'text-destructive'}>{t('common.logout')}</Text>
            </Button>
          </ExpandItem>
        </ExpandRow>
      </Modal>
      {children}
    </>
  );
}

export function LeaveGroupConfirmationModal({
  children,
  onVisibleChange,
  visible,
}: PropsWithChildren<{
  visible: boolean;
  onVisibleChange: Dispatch<SetStateAction<boolean>>;
}>) {
  const { userProfile } = useCurrentUser();
  const [leaveGroup, leaving] = useLoading(useRefreshOnSuccess(useLeaveSpot()), {
    beforeMarkingComplete: () => onVisibleChange(false),
  });
  const { colors } = useColorScheme();
  const { t } = useTranslation();

  const handleLeave = async () => {
    onVisibleChange(false);
    await leaveGroup();
  };

  return (
    <>
      <Modal open={visible} onOpenChange={onVisibleChange}>
        <ModalTitle
          text={t('user.parking.confirmLeaveGroup.title', {
            groupName: userProfile.spot?.parking?.name,
          })}
          icon={<ThemedIcon name={'warning'} />}
        />
        <Text>{t('user.parking.confirmLeaveGroup.description')}</Text>
        <ExpandRow className="mt-4">
          <ExpandItem>
            <Button size={'lg'} variant="tonal" onPress={() => onVisibleChange(false)}>
              <Text className={'text-primary'}>{t('common.back')}</Text>
            </Button>
          </ExpandItem>
          <ExpandItem>
            <Button variant={'plain'} size={'lg'} onPress={() => handleLeave()}>
              {leaving ? (
                <ActivityIndicator color={colors.destructive} />
              ) : (
                <ThemedIcon
                  name={'car-off'}
                  component={MaterialCommunityIcons}
                  color={colors.destructive}
                />
              )}
              <Text className={'text-destructive'}>
                {t('user.parking.confirmLeaveGroup.confirm')}
              </Text>
            </Button>
          </ExpandItem>
        </ExpandRow>
      </Modal>
      {children}
    </>
  );
}

function SettingsBottomSheet(props: {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmAccountDeletion, setConfirmAccountDeletion] = useState(false);

  const { colors } = useColorScheme();
  const bottomSheetRef = useSheetRefWithState(props.open);
  const { t } = useTranslation();

  return (
    <Sheet
      ref={bottomSheetRef}
      enableDynamicSizing={false}
      snapPoints={[300]}
      onDismiss={() => props.onOpenChange(false)}>
      <ContentSheetView className={'flex-col gap-8'}>
        <Button
          variant={'plain'}
          onPress={() => setConfirmLogout(true)}
          size={'lg'}
          className={'bg-destructive/15'}>
          <ThemedIcon
            name={'arrow-right-from-bracket'}
            component={FontAwesome6}
            color={colors.destructive}
          />
          <Text className={'text-destructive'}>{t('user.profile.logout')}</Text>
        </Button>
        <Button variant={'plain'} onPress={() => setConfirmAccountDeletion(true)} size={'lg'}>
          <ThemedIcon name={'ban'} component={FontAwesome6} color={colors.destructive} />
          <Text className={'text-destructive'}>{t('user.profile.deleteAccount')}</Text>
        </Button>
        <AppVersionInfo />
        <LogoutConfirmationModal visible={confirmLogout} onVisibleChange={setConfirmLogout} />
        <AccountDeletionConfirmationModal
          visible={confirmAccountDeletion}
          onVisibleChange={setConfirmAccountDeletion}
        />
      </ContentSheetView>
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
  const [lotName, setLotName] = useState<string>('');
  const { colors } = useColorScheme();
  const [confirmedParkingName, setConfirmedParkingName] = useState<string | null>(null);
  const [defineSpot, isJoiningGroup] = useLoading(useRefreshOnSuccess(useDefineSpot()), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });
  const { t } = useTranslation();
  const { userProfile } = useCurrentUser();

  const [createParking, isCreating] = useLoading(useCreateParking(), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });
  const [editParking, isEditing] = useLoading(useEditParkingInfo(), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });
  const [deleteParking, isDeleting] = useLoading(useRefreshOnSuccess(useDeleteParking()), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });

  useEffect(() => {
    setAddress(props.parking?.address ?? '');
    setName(props.parking?.name ?? '');
  }, [props.parking, props.open]);

  useEffect(() => {
    setConfirmedParkingName(null);
  }, [props.open]);

  const lotNameIsValid = mode === 'create' ? lotName.trim().length > 0 : true;

  const submitFn = {
    create: () =>
      createParking({ name, address }).then((parking) => {
        defineSpot({ parkingId: parking.id, lotName: lotName });
      }),

    edit: () => (props.parking?.id ? editParking(props.parking.id, { name, address }) : undefined),
  };

  const isSubmitting = {
    create: isCreating || isJoiningGroup,
    edit: isEditing,
  };

  const submitText = {
    create: t('user.parking.create', { name }),
    edit: t('common.save'),
  };

  const titleText = {
    create: t('user.parking.openOptions.createParking'),
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

  const FREE_PARKING_MAX_SPOT = 10;

  return (
    <Modal open={props.open} onOpenChange={props.onOpenChange} className={'flex-col gap-6'}>
      <ModalTitle text={titleText[mode]} />
      <View className="w-full flex-row items-center gap-2 px-2">
        <ThemedIcon name={'user-plus'} component={FontAwesome6} size={12} />
        <Text className="text-center text-sm">
          {t('user.parking.memberMaxCount', { memberCount: FREE_PARKING_MAX_SPOT - 1 })}
        </Text>
      </View>
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
        />
        {mode === 'create' && (
          <TextInput
            value={lotName}
            onChangeText={setLotName}
            placeholder={t('user.parking.parkingLotname')}
            maxLength={10}
          />
        )}
        {mode === 'create' && userProfile.spot && (
          <Text variant={'callout'} className="mt-2 text-destructive">
            {t('user.parking.confirmLeaveGroup.leaveAndChangeGroup')}
          </Text>
        )}
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
          <ExpandRow className={cn(confirmedParkingName !== null && 'flex-row justify-between')}>
            {confirmedParkingName !== null && (
              <ExpandItem>
                <Button variant={'tonal'} onPress={() => setConfirmedParkingName(null)}>
                  <Text>{t('user.parking.cancelDelete')}</Text>
                </Button>
              </ExpandItem>
            )}
            <ExpandItem>
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
            </ExpandItem>
          </ExpandRow>
        </>
      )}

      <Button
        disabled={!name || !address || isSubmitting[mode] || !lotNameIsValid}
        onPress={onSubmit}
        className="">
        {isSubmitting[mode] && <ActivityIndicator color={colors.foreground} />}
        <Text>{submitText[mode]}</Text>
      </Button>
    </Modal>
  );
}

function ParkingBottomSheet(props: {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
  const { userProfile } = useCurrentUser();
  const [currentSpotName, setCurrentSpotName] = useState(userProfile.spot?.name);
  const [step, setStep] = useState<'select-parking-option' | 'searchGroup'>(
    'select-parking-option'
  );
  const [confirmLeaveGroup, setConfirmLeaveGroup] = useState(false);

  const { colors } = useColorScheme();
  const bottomSheetModalRef = useSheetRefWithState(props.open);
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
  const [openParkingModal, setOpenParkingModal] = useState(false);

  const router = useRouter();

  const spotNameRef = createRef<ReactTextInput>();
  const { keyboardVisible, keyboardHeight } = useKeyboardVisible();

  // Notify the user that they must select a group
  useEffect(() => {
    if (!userProfile.spot) {
      setOpenParkingModal(true);
    }
  }, [userProfile.spot]);

  useEffect(() => {
    if (props.open) {
      parking &&
        setSelectedParking(parking.find((parking) => parking.id === userProfile.spot?.parking.id));
    } else {
      setSearch(undefined);
      setStep('select-parking-option');
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
    setSearch(parking.name);
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

  const optionActions: {
    label: string;
    onPress: () => void;
    icon: ReactNode;
    color?: keyof typeof colors;
    isLoading?: boolean;
    disabled?: boolean;
  }[] = [
    {
      label: t('user.parking.openOptions.searchGroup'),
      onPress: () => setStep('searchGroup'),
      icon: (
        <ThemedIcon name={'magnifying-glass'} component={FontAwesome6} color={colors.primary} />
      ),
    },
    {
      label: t('user.parking.openOptions.joinWithCode'),
      onPress: () => router.replace('/join-parking'),
      icon: <ThemedIcon name={'ticket'} component={FontAwesome6} color={colors.primary} />,
    },
    {
      label: t('user.parking.openOptions.leave'),
      color: 'destructive',
      onPress: () => {
        props.onOpenChange(false);
        setConfirmLeaveGroup(true);
      },
      disabled: !userProfile.spot,
      icon: (
        <ThemedIcon
          name={'car-off'}
          component={MaterialCommunityIcons}
          color={colors.destructive}
        />
      ),
    },
    {
      label: t('user.parking.openOptions.createParking'),
      onPress: () => {
        props.onOpenChange(false);
        initiateParkingCreation();
      },
      icon: <ThemedIcon name={'plus'} component={FontAwesome6} color={colors.primary} />,
    },
  ];

  const SheetContent = () => {
    switch (step) {
      case 'select-parking-option':
        return (
          <ContentSheetView className={'flex-col gap-6'}>
            <SheetTitle
              className={'items-center justify-between'}
              action={
                userProfile.spot?.parking?.ownerId === userProfile.id && (
                  <Button
                    variant={'plain'}
                    onPress={() => userProfile.spot && onParkingEdit(userProfile.spot.parking)}>
                    <ThemedIcon name={'pencil'} />
                  </Button>
                )
              }>
              {userProfile.spot?.parking?.name ?? t('user.parking.openOptions.title.noGroup')}
            </SheetTitle>
            <View className={'grid grid-cols-2 flex-row flex-wrap'}>
              {optionActions.map((option, i) => (
                <View
                  key={i}
                  // manual gap calculation as the regular gap won't
                  // work with the w-1/2 trick for force 2 columns
                  className={cn(
                    'w-1/2',
                    i % 2 === 0 && 'pr-2',
                    i % 2 === 1 && 'pl-2',
                    i < optionActions.length - 2 ? 'mb-2' : 'mt-2'
                  )}>
                  <Button
                    variant={option.color ? 'plain' : 'tonal'}
                    onPress={option.onPress}
                    disabled={option.disabled}
                    style={{
                      backgroundColor: opacity(colors[option.color ?? 'primary'], 0.1),
                      borderRadius: 15,
                    }}>
                    <View className={'flex-row items-center justify-between gap-3'}>
                      {option.isLoading ? (
                        <ActivityIndicator color={colors[option.color ?? 'primary']} />
                      ) : (
                        option.icon
                      )}
                      <Text
                        className={'w-2/3'}
                        style={{
                          color: colors[option.color ?? 'primary'] ?? colors.foreground,
                        }}>
                        {option.label}
                      </Text>
                    </View>
                  </Button>
                </View>
              ))}
            </View>
          </ContentSheetView>
        );
      case 'searchGroup':
        return (
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
                placeholder={t('user.parking.openOptions.searchGroup')}
              />
              <CardContainer className={'flex-1'}>
                {parking && parking.length > 0 ? (
                  parking.map((parking) => (
                    <ParkingCard
                      key={parking.id}
                      parking={parking}
                      isSelected={selectedParking?.id === parking.id}
                      onSelect={() => selectParking(parking)}
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
              <>
                <View className="flex-col gap-8">
                  <View className="w-full flex-row items-center justify-between">
                    <Text disabled={!selectedParking} className="disabled:opacity-50">
                      {t('common.spot.numberLabel')}
                    </Text>
                    <TextInput
                      ref={spotNameRef}
                      className="w-40"
                      icon={{
                        position: 'right',
                        element: <ThemedIcon name={'pencil'} />,
                      }}
                      value={currentSpotName}
                      editable={!!selectedParking}
                      onChangeText={setCurrentSpotName}
                    />
                  </View>
                </View>
                <Button
                  className={`w-full rounded-xl bg-primary`}
                  disabled={!selectedParking || !currentSpotName || isUpdating}
                  onPress={() => updateParking()}
                  size={'lg'}>
                  {isUpdating && <ActivityIndicator color={colors.foreground} />}
                  <Text className="text-white">{t('common.save')}</Text>
                </Button>
              </>
            )}
          </ContentSheetView>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <LeaveGroupConfirmationModal
        visible={confirmLeaveGroup}
        onVisibleChange={setConfirmLeaveGroup}
      />
      <Modal {...props} open={openParkingModal}>
        <View className="items-center">
          <CautionIllustration width={250} height={250} />
        </View>
        <View className={'gap-8'}>
          <Text>{t('user.parking.noParkingPopup.body')}</Text>
          <Button variant="primary" className="w-full" onPress={() => setOpenParkingModal(false)}>
            <Text>{t('user.parking.noParkingPopup.callToAction')}</Text>
          </Button>
        </View>
      </Modal>

      <ParkingModal
        parking={editingParking}
        open={parkingModalOpen}
        onOpenChange={setParkingModalOpen}
        onParking={replaceParkingState}
        onDelete={deleteParkingState}
      />

      <Sheet
        ref={bottomSheetModalRef}
        enableDynamicSizing={false}
        onDismiss={() => props.onOpenChange(false)}
        snapPoints={step === 'searchGroup' ? ['90%'] : [300]}>
        {SheetContent()}
      </Sheet>
    </>
  );
}

function ParkingCard(props: {
  isSelected: boolean;
  parking: ParkingResponse;
  onSelect: () => void;
}) {
  const { colors } = useColorScheme();

  return (
    <Pressable disabled={props.parking.isFull} onPress={props.onSelect}>
      <Card highlight={props.isSelected}>
        <View className={'flex-row items-center justify-between gap-2'}>
          <Text numberOfLines={2} ellipsizeMode={'tail'} className={'flex-1 text-lg font-bold'}>
            {props.parking.name}
          </Text>
          <ParkingSpotCount parking={props.parking} />
        </View>
        <View className="flex-row items-center justify-between gap-4">
          <View className={'w-4/5 flex-row items-center gap-4'}>
            <ThemedIcon name={'tag'} component={FontAwesome6} />
            <Text className={'text-sm'}>{props.parking.address}</Text>
          </View>
          {props.parking.isFull && <ThemedIcon name={'lock'} color={colors.destructive} />}
          {props.isSelected && <ThemedIcon name={'check'} color={colors.primary} />}
        </View>
      </Card>
    </Pressable>
  );
}
