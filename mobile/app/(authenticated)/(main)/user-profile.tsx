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
import { FontAwesome6, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '~/authentication/AuthProvider';
import { Card, CardContainer } from '~/components/Card';
import { TextInput as ReactTextInput } from 'react-native/Libraries/Components/TextInput/TextInput';
import { cn } from '~/lib/cn';
import { SheetTitle, Title } from '~/components/Title';
import { useLogout } from '~/endpoints/me/logout';
import { ContentSheetView } from '~/components/ContentView';
import { Modal, ModalTitle } from '~/components/Modal';
import { useKeyboardVisible } from '~/lib/useKeyboardVisible';
import { useDeleteAccount } from '~/endpoints/me/delete-account';
import { Checkbox } from '~/components/Checkbox';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { chunk, opacity } from '~/lib/utils';
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

export default function UserProfileScreen() {
  const { firebaseUser } = useAuth();
  const { colors } = useColorScheme();
  const { userProfile, updateUserProfile } = useCurrentUser();
  const { t } = useTranslation();
  const [currentDisplayName, setCurrentDisplayName] = useState(userProfile.displayName);
  const [bottomSheet, setBottomSheet] = useState(false);

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
  const [step, setStep] = useState<string>('');

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

  function openDefineSpotSheet() {
    setStep('button');
    setBottomSheet(true);
  }

  function openParameterSheet() {
    setStep('parameter');
    setBottomSheet(true);
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
          <View className="flex-row items-center">
            <Title
              action={<ShareSpot />}
              icon={{
                element: (
                  <ThemedIcon name={'user-group'} component={FontAwesome6} color={colors.primary} />
                ),
              }}>
              {t('user.profile.mySpot')}
            </Title>
          </View>
          <View className={'mt-2 flex-col gap-2'}>
            <Pressable
              onPress={() => openDefineSpotSheet()}
              className={`${!userProfile.spot ? 'bg-destructive/60' : ''} rounded-xl border`}>
              <Card className="flex-col items-start gap-3">
                <View className="w-full flex-row items-center justify-between">
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
                    <Text>
                      {t('common.spot.name', {
                        parking: userProfile.spot.parking.name,
                        number: userProfile.spot.name,
                      })}
                    </Text>
                  )}
                  <ThemedIcon name={'pencil'} />
                </View>
              </Card>
            </Pressable>
          </View>
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
          <Pressable onPress={() => openParameterSheet()}>
            <Card className="flex-col items-start gap-3">
              <View className="w-full flex-row items-center justify-between">
                <Text>{t('user.profile.parameter.cardTitle')}</Text>
              </View>
            </Card>
          </Pressable>
        </View>
      </ScreenWithHeader>
      <BottomSheet open={bottomSheet} onOpenChange={setBottomSheet} step={step} setStep={setStep} />
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

function BottomSheet(props: {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  step: string;
  setStep: Dispatch<SetStateAction<string>>;
}) {
  const { userProfile } = useCurrentUser();
  const [currentSpotName, setCurrentSpotName] = useState(userProfile.spot?.name);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmAccountDeletion, setConfirmAccountDeletion] = useState(false);

  const { colors } = useColorScheme();
  const bottomSheetModalRef = useSheetRef();
  const { t } = useTranslation();

  const [search, setSearch] = useState<string>();
  const [searchFocused, setSearchFocused] = useState(false);
  const searchParking = useSearchParking();

  const [defineSpot, isUpdating] = useLoading(useRefreshOnSuccess(useDefineSpot()), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });
  const [leaveSpot, isLeaving] = useLoading(useRefreshOnSuccess(useLeaveSpot()), {
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
  const [openModal, setOpenModal] = useState(false);

  const router = useRouter();

  const spotNameRef = createRef<ReactTextInput>();
  const { keyboardVisible, keyboardHeight } = useKeyboardVisible();

  // Notify the user that they must select a group
  useEffect(() => {
    if (!userProfile.spot) {
      setOpenModal(true);
    }
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

  function openSearchGroup() {
    props.setStep('searchGroup');
  }

  const BottomSheetContent = () => {
    const optionActions: {
      label: string;
      onPress: () => void;
      icon: ReactNode;
      color?: keyof typeof colors;
      isLoading?: boolean;
    }[] = [
      {
        label: t('user.parking.openOptions.searchGroup'),
        onPress: openSearchGroup,
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
        label: t('user.parking.openOptions.createParking'),
        onPress: initiateParkingCreation,
        color: 'success',
        icon: <ThemedIcon name={'plus'} component={FontAwesome6} color={colors.success} />,
      },
      {
        label: t('user.parking.openOptions.leave'),
        color: 'destructive',
        onPress: leaveSpot,
        isLoading: isLeaving,
        icon: (
          <ThemedIcon
            name={'car-off'}
            component={MaterialCommunityIcons}
            color={colors.destructive}
          />
        ),
      },
    ];
    switch (props.step) {
      case 'button':
        return (
          <Sheet
            ref={bottomSheetModalRef}
            enableDynamicSizing={false}
            onDismiss={() => props.onOpenChange(false)}
            snapPoints={['34%']}>
            <ContentSheetView className={'flex-col gap-6'}>
              <SheetTitle>{t('user.parking.openOptions.title')}</SheetTitle>
              <View className={'gap-4'}>
                {chunk(optionActions, 2).map((chunk, chunkIndex) => (
                  <View className={'flex-row gap-4'} key={chunkIndex}>
                    {chunk.map((option, i) => (
                      <Button
                        key={i}
                        variant={option.color ? 'plain' : 'tonal'}
                        onPress={option.onPress}
                        className={cn('flex-1 justify-around')}
                        style={{
                          backgroundColor: opacity(colors[option.color ?? 'primary'], 0.1),
                          borderRadius: 15,
                        }}>
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
                      </Button>
                    ))}
                  </View>
                ))}
              </View>
            </ContentSheetView>
          </Sheet>
        );
      case 'searchGroup':
        return (
          <Sheet
            ref={bottomSheetModalRef}
            enableDynamicSizing={false}
            onDismiss={() => props.onOpenChange(false)}
            snapPoints={keyboardVisible ? ['80%'] : ['80%']}>
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
          </Sheet>
        );
      case 'parameter':
        return (
          <Sheet
            ref={bottomSheetModalRef}
            enableDynamicSizing={false}
            onDismiss={() => props.onOpenChange(false)}
            snapPoints={keyboardVisible ? ['30%'] : ['30%']}>
            <ContentSheetView
              className={'flex-col gap-8'}
              style={
                keyboardVisible && {
                  paddingBottom: keyboardHeight + 24,
                }
              }>
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
                <Text className={'text-destructive'}>{t('common.logout')}</Text>
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
      default:
        return null;
    }
  };

  const ParkingModalWrapper = () => {
    return (
      <ParkingModal
        parking={editingParking}
        open={parkingModalOpen}
        onOpenChange={setParkingModalOpen}
        onParking={replaceParkingState}
        onDelete={deleteParkingState}
      />
    );
  };

  return (
    <>
      <Modal {...props} open={openModal}>
        <View className="items-center">
          <CautionIllustration width={250} height={250} />
        </View>
        <View>
          <Text className="text-center text-base">{t('user.parking.notify.body')}</Text>
          <Button variant="primary" className="mt-8 w-full" onPress={() => setOpenModal(false)}>
            <Text>{t('user.parking.notify.callToAction')}</Text>
          </Button>
        </View>
      </Modal>
      {BottomSheetContent()}
      {ParkingModalWrapper()}
    </>
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
            <ThemedIcon name={'user'} />
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
    setName(props.parking?.name ?? '');
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

  return (
    <Modal open={props.open} onOpenChange={props.onOpenChange} className={'flex-col gap-6'}>
      <ModalTitle text={titleText[mode]} />
      <View className="w-full flex-row items-center gap-2 px-2">
        <ThemedIcon name={'user-plus'} component={FontAwesome6} size={12} />
        <Text className="text-center text-sm">
          {t('user.parking.memberMaxCount', { memberCount: 9 })}
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
          icon={{
            element: <ThemedIcon name={'tag'} component={FontAwesome6} />,
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
