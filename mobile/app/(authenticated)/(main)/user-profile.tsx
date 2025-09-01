import {
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
  Linking,
  Platform,
  Pressable,
  Share,
  Switch,
  TextInput as ReactTextInput,
  View,
} from 'react-native';
import { useCurrentUser } from '~/authentication/UserProvider';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import { KnownIcon, ThemedIcon } from '~/components/ThemedIcon';
import { TextInput } from '~/components/TextInput';
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
import { formatDate, formatDistance } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Rating } from '~/components/Rating';
import { universalLink } from '~/endpoints/universalLink';
import { AppContext } from '~/app/_layout';
import { firebaseAuth } from '~/authentication/firebase';
import { useRouter } from 'expo-router';
import CautionIllustration from '~/assets/caution.svg';
import { useLeaveSpot } from '~/endpoints/parkings/leave-spot';
import { ExpandItem, ExpandRow } from '~/components/ExpandItem';
import { useSearchParking } from '~/endpoints/parkings/search-parking';
import { useDefineSpot } from '~/endpoints/parkings/define-spot';
import { useKeyboardVisible } from '~/lib/useKeyboardVisible';
import { ParkingSpotCount } from '~/components/ParkingSpotCount';
import { DynamicBottomSheet, DynamicBottomSheetTextInput } from '~/components/DynamicBottomSheet';
import { ContactUsButton } from '~/components/ContactUsButton';
import { useIAP } from 'expo-iap';
import { PremiumButton, useGetPlanInfo } from '~/components/FriendspotPlus';
import { Form } from '~/form/Form';
import { FormInput } from '~/form/FormInput';
import { useValidators } from '~/form/validators';
import { urls } from '~/lib/urls';
import { OpenSection } from '~/components/OpenSection';
import { CopyToClipboard } from '~/components/CopyToClipboard';
import { UserSpot } from '~/endpoints/me/get-profile';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import * as Expo from 'expo';

export default function UserProfile() {
  const { firebaseUser } = useAuth();
  const { colors } = useColorScheme();
  const { userProfile, updateUserProfile, features } = useCurrentUser();
  const { t } = useTranslation();
  const [currentDisplayName, setCurrentDisplayName] = useState(userProfile.displayName);
  const [parkingBottomSheetOpen, setParkingBottomSheetOpen] = useState(false);
  const [parameterSheetOpen, setParameterSheetOpen] = useState(false);
  const [supportSheetOpen, setSupportSheetOpen] = useState(false);

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
            <ScreenTitle
              wallet={false}
              title={userProfile.displayName}
              icon={features.isPremium && <KnownIcon name={'premium'} size={26} />}
              className={'mb-0'}>
              <View className={'flex-row gap-2'}>
                <Rating
                  displayRating
                  rating={userProfile.rating}
                  stars={3}
                  color={colors.primary}
                />
              </View>
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
            action={
              userProfile.spot && (
                <View className={'flex-row items-center gap-4'}>
                  <CopyToClipboard
                    textToCopy={userProfile.spot.parking.code}
                    icon={<ThemedIcon name={'copy'} component={FontAwesome6} />}
                  />
                  <ShareSpot spot={userProfile.spot} />
                </View>
              )
            }
            icon={{
              element: <ThemedIcon name={'user-group'} component={FontAwesome6} />,
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
                  <View className={'flex-row items-center gap-2'}>
                    {features.currentParkingIsLocked && <KnownIcon name={'warning'} />}

                    <Text numberOfLines={2} ellipsizeMode={'tail'}>
                      {t('common.spot.name', {
                        parking: userProfile.spot.parking.name,
                        number: userProfile.spot.name,
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </Pressable>
        </View>
        <View className={'flex-col gap-2'}>
          <OpenSection
            onPress={() => setSupportSheetOpen(true)}
            icon={<KnownIcon name={'support'} color={colors.primary} />}
            title={t('user.profile.support.open')}
          />
          <OpenSection
            onPress={() => setParameterSheetOpen(true)}
            icon={<KnownIcon name={'settings'} color={colors.primary} />}
            title={t('user.profile.settings.open')}
          />
        </View>
      </ScreenWithHeader>
      <ParkingBottomSheet open={parkingBottomSheetOpen} onOpenChange={setParkingBottomSheetOpen} />
      <SettingsBottomSheet open={parameterSheetOpen} onOpenChange={setParameterSheetOpen} />
      <SupportBottomSheet open={supportSheetOpen} onOpenChange={setSupportSheetOpen} />
    </>
  );
}

function ShareSpot({ spot }: { spot: UserSpot }) {
  const { t } = useTranslation();

  async function shareSpot(code: string) {
    await Share.share(
      {
        title: t('user.parking.share.title'),
        message: t('user.parking.share.message', {
          code: code,
          url: universalLink(`join-parking?code=${code}`),
        }),
      },
      { dialogTitle: t('user.parking.share.title') }
    );
  }

  return (
    <Button variant={'primary'} size={'sm'} onPress={() => shareSpot(spot.parking.code)}>
      <ThemedIcon name={'share'} component={FontAwesome6} />
      <Text>{t('user.parking.share.button')}</Text>
    </Button>
  );
}

function AccountDeletionConfirmationModal({
  children,
  visible,
  onVisibleChange,
}: PropsWithChildren<{
  visible: boolean;
  onVisibleChange: Dispatch<SetStateAction<boolean>>;
}>) {
  const deleteAccountBackend = useDeleteAccount();
  const { colors } = useColorScheme();
  const [userHasConfirmed, setUserHasConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { firebaseUser } = useAuth();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [invalidPassword, setInvalidPassword] = useState(false);
  const validators = useValidators();

  async function reauthenticateUserBeforeDeletingAccount() {
    if (!firebaseUser.email) {
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, password);
      await reauthenticateWithCredential(firebaseUser, credential);
    } catch {
      setInvalidPassword(true);
      return false;
    }

    return true;
  }

  async function deleteAccountBackendAndFirebase() {
    await deleteAccountBackend();
    await firebaseUser.delete().catch((e) => {
      console.error(e);
      // we need to do a recent sign-in to be able to delete the account on firebase
      firebaseAuth.signOut();
    });
  }

  async function deleteAccount() {
    setIsDeleting(true);

    try {
      const authWasValid = await reauthenticateUserBeforeDeletingAccount();
      authWasValid && (await deleteAccountBackendAndFirebase());
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    if (visible) return;

    setUserHasConfirmed(false);
    setPassword('');
    setInvalidPassword(false);
  }, [visible]);

  return (
    <>
      <Modal open={visible} onOpenChange={onVisibleChange} className={'bg-destructive/20 gap-4'}>
        <ModalTitle
          text={t('user.profile.support.deleteAccount.title')}
          icon={<ThemedIcon name={'warning'} />}
        />

        <Form>
          {({ handleSubmit, isValid }) => (
            <>
              <View className={'mt-4 flex-col gap-8'}>
                <Text className={'text-destructive'} variant={'callout'}>
                  {t('user.profile.support.deleteAccount.confirmation')}
                </Text>

                <FormInput
                  value={password}
                  onValueChange={setPassword}
                  placeholder={t('auth.password')}
                  secureTextEntry={true}
                  validators={[validators.required]}
                  error={invalidPassword && t('user.profile.support.deleteAccount.invalidPassword')}
                />

                <View className={'flex-row items-center gap-4'}>
                  <Checkbox
                    value={userHasConfirmed}
                    onValueChange={setUserHasConfirmed}
                    style={{
                      borderColor: colors.foreground,
                      borderRadius: 6,
                    }}
                  />
                  <Text variant={'caption1'} className={'flex-1'}>
                    {t('user.profile.support.deleteAccount.confirm')}
                  </Text>
                </View>
              </View>

              <ExpandRow className="mt-4">
                <ExpandItem>
                  <Button size={'lg'} variant="tonal" onPress={() => onVisibleChange(false)}>
                    <Text>{t('common.cancel')}</Text>
                  </Button>
                </ExpandItem>
                <ExpandItem>
                  <Button
                    disabled={!isValid || !userHasConfirmed}
                    variant={'plain'}
                    size={'lg'}
                    onPress={handleSubmit(deleteAccount)}>
                    {isDeleting ? (
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
            </>
          )}
        </Form>
      </Modal>
      {children}
    </>
  );
}

function LogoutConfirmationModal({
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
        <ModalTitle text={t('user.profile.settings.logoutConfirmation')} />
        <ExpandRow className="mt-4">
          <ExpandItem>
            <Button size={'lg'} variant="tonal" onPress={() => onVisibleChange(false)}>
              <Text>{t('common.back')}</Text>
            </Button>
          </ExpandItem>
          <ExpandItem>
            <Button variant={'plain'} size={'lg'} onPress={() => handleLogout()}>
              {loggingOut ? (
                <ActivityIndicator color={colors.destructive} />
              ) : (
                <ThemedIcon name={'logout'} component={MaterialIcons} color={colors.destructive} />
              )}
              <Text className={'text-destructive'}>{t('user.profile.settings.logout')}</Text>
            </Button>
          </ExpandItem>
        </ExpandRow>
      </Modal>
      {children}
    </>
  );
}

function LeaveGroupConfirmationModal({
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
              <Text>{t('common.back')}</Text>
            </Button>
          </ExpandItem>
          <ExpandItem>
            <Button variant={'plain'} size={'lg'} onPress={leaveGroup}>
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

function SupportBottomSheet(props: {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
  const [confirmAccountDeletion, setConfirmAccountDeletion] = useState(false);

  const [debugOpen, setDebugOpen] = useState(false);
  const { t } = useTranslation();
  const { colors } = useColorScheme();

  const infoEntries = [
    {
      icon: (
        <ThemedIcon name={'tags'} component={FontAwesome6} color={colors.foreground} size={14} />
      ),
      title: 'Name',
      content: Platform.select({
        ios: Constants.expoConfig?.ios?.bundleIdentifier,
        android: Constants.expoConfig?.android?.package,
      }),
    },
    {
      icon: (
        <ThemedIcon
          name={'box-open'}
          component={FontAwesome6}
          color={colors.foreground}
          size={14}
        />
      ),
      title: 'SDK',
      content: Constants.expoConfig?.sdkVersion,
    },
    {
      icon: (
        <ThemedIcon
          name={'code-branch'}
          component={FontAwesome6}
          color={colors.foreground}
          size={14}
        />
      ),
      title: 'Env',
      content: Updates.channel?.length ? Updates.channel : 'Unknown',
    },
    {
      icon: (
        <ThemedIcon
          name={'code-compare'}
          component={FontAwesome6}
          color={colors.foreground}
          size={14}
        />
      ),
      title: 'Version',
      content: `${Constants.expoConfig?.version ?? 'Unknown'} - ${
        Updates.createdAt
          ? t('app.otaPatch', {
              time: formatDistance(Updates.createdAt, new Date(), { addSuffix: true }),
            })
          : t('app.noOtaPatch')
      }`,
    },
  ];

  return (
    <>
      <AccountDeletionConfirmationModal
        visible={confirmAccountDeletion}
        onVisibleChange={setConfirmAccountDeletion}
      />
      <Modal open={debugOpen} onOpenChange={setDebugOpen}>
        <View className={'gap-3 p-1'}>
          {infoEntries.map((infoEntry, i) => (
            <View key={i} className={'flex-row items-center justify-between'}>
              <View className={'flex-row items-center gap-2'}>
                <View className={'w-3'}>{infoEntry.icon}</View>
                <Text className={'text-sm font-semibold'}>{infoEntry.title}</Text>
              </View>

              <Text className={'text-sm'}>{infoEntry.content}</Text>
            </View>
          ))}
        </View>
      </Modal>
      <DynamicBottomSheet open={props.open} onOpenChange={props.onOpenChange}>
        <SheetTitle icon={<KnownIcon name={'support'} size={22} />}>
          {t('user.profile.support.title')}
        </SheetTitle>

        <View className={'gap-2'}>
          <ContactUsButton size={'lg'} variant={'tonal'}>
            <ThemedIcon name={'envelope'} component={FontAwesome6} color={colors.primary} />
            <Text>{t('user.profile.support.contactSupport')}</Text>
          </ContactUsButton>

          <Button
            className={'w-full'}
            size={'lg'}
            variant={'plain'}
            onPress={() => setDebugOpen(true)}>
            <ThemedIcon name={'wrench'} component={FontAwesome6} color={colors.primary} />
            <Text className={'text-primary'}>{t('user.profile.support.appInfo')}</Text>
          </Button>
        </View>

        <View className={'gap-2'}>
          <Button variant={'plain'} onPress={() => Linking.openURL(urls.privacyPolicy)}>
            <ThemedIcon name={'user-shield'} component={FontAwesome6} />
            <Text>{t('user.profile.support.privacyPolicy')}</Text>
          </Button>
          <Button variant={'plain'} onPress={() => Linking.openURL(urls.termsOfUse)}>
            <ThemedIcon name={'file-contract'} component={FontAwesome6} />
            <Text>{t('user.profile.support.termsOfUse')}</Text>
          </Button>
        </View>

        <View className={'gap-4'}>
          <Button variant={'plain'} onPress={() => setConfirmAccountDeletion(true)}>
            <ThemedIcon name={'ban'} component={FontAwesome6} color={colors.destructive} />
            <Text className={'text-destructive'}>
              {t('user.profile.support.deleteAccount.button')}
            </Text>
          </Button>
        </View>
      </DynamicBottomSheet>
    </>
  );
}

function SettingsBottomSheet(props: {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { restorePurchases } = useIAP({ shouldAutoSyncPurchases: true });
  const { features } = useCurrentUser();
  const { firebaseUser } = useAuth();
  const getPlanInfo = useGetPlanInfo();
  const [restorePurchasesWithReload, isRestoringPurchases] = useLoading(restorePurchases, {
    beforeMarkingComplete: () => Expo.reloadAppAsync(),
  });

  const { colors } = useColorScheme();
  const { t } = useTranslation();

  const activePlanInfo = features.plan && getPlanInfo(features.plan.productId);

  return (
    <>
      <DynamicBottomSheet open={props.open} onOpenChange={props.onOpenChange}>
        <SheetTitle icon={<KnownIcon name={'settings'} size={22} />}>
          {t('user.profile.settings.title')}
        </SheetTitle>

        <Card className={'gap-2'}>
          <View className={'flex-row items-center gap-2'}>
            <ThemedIcon name={'user-check'} component={FontAwesome6} />
            <Text>
              {t('user.profile.settings.accountCreated', {
                date: formatDate(new Date(firebaseUser.metadata.creationTime ?? new Date()), 'PP'),
              })}
            </Text>
          </View>

          {activePlanInfo && (
            <View className={'flex-row items-center gap-2'}>
              <KnownIcon name={'premium'} />
              <Text>{t(`friendspotplus.plans.${activePlanInfo.i18nKey}.accountName`)}</Text>
            </View>
          )}
        </Card>

        <View className={'gap-4'}>
          <Button onPress={restorePurchasesWithReload} size={'lg'} variant={'tonal'}>
            {isRestoringPurchases ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <ThemedIcon
                name={'cart-arrow-down'}
                component={FontAwesome6}
                color={colors.primary}
              />
            )}
            <Text>{t('user.profile.settings.restorePurchases')}</Text>
          </Button>
          <Button size={'lg'} variant={'plain'} onPress={() => setConfirmLogout(true)}>
            <ThemedIcon
              name={'arrow-right-from-bracket'}
              component={FontAwesome6}
              color={colors.destructive}
            />
            <Text className={'text-destructive'}>{t('user.profile.settings.logout')}</Text>
          </Button>
        </View>
      </DynamicBottomSheet>
      <LogoutConfirmationModal visible={confirmLogout} onVisibleChange={setConfirmLogout} />
    </>
  );
}

function ParkingModal(props: {
  parking: ParkingResponse | null;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onOk: () => void;
}) {
  const mode = props.parking ? 'edit' : 'create';
  const [address, setAddress] = useState(props.parking?.address ?? '');
  const [name, setName] = useState(props.parking?.name ?? '');
  const [lotName, setLotName] = useState('');
  const [neighbourhoodGroup, setNeighbourhoodGroup] = useState(false);
  const { colors } = useColorScheme();
  const [wantToDeleteParking, setWantToDeleteParking] = useState(false);
  const [confirmedParkingName, setConfirmedParkingName] = useState('');
  const [defineSpot, isJoiningGroup] = useLoading(useRefreshOnSuccess(useDefineSpot()), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });
  const { t } = useTranslation();
  const { features } = useCurrentUser();
  const { keyboardVisible } = useKeyboardVisible();
  const validators = useValidators();

  const [createParking, isCreating] = useLoading(useCreateParking(), {
    beforeMarkingComplete: () => {
      props.onOpenChange(false);
      props.onOk();
    },
  });
  const [editParking, isEditing] = useLoading(useRefreshOnSuccess(useEditParkingInfo()), {
    beforeMarkingComplete: () => {
      props.onOpenChange(false);
      props.onOk();
    },
  });
  const [deleteParking, isDeleting] = useLoading(useRefreshOnSuccess(useDeleteParking()), {
    beforeMarkingComplete: () => {
      props.onOpenChange(false);
      props.onOk();
    },
  });

  useEffect(() => {
    setName(props.parking?.name ?? '');
    setAddress(props.parking?.address ?? '');
    setLotName('');
    setWantToDeleteParking(false);
    setNeighbourhoodGroup(false);
  }, [props.open]);

  useEffect(() => {
    !wantToDeleteParking && setConfirmedParkingName('');
  }, [wantToDeleteParking]);

  const submitFn = {
    create: () =>
      createParking({ name, address, neighbourhood: neighbourhoodGroup }).then((parking) =>
        defineSpot({ parkingId: parking.id, lotName: lotName })
      ),

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
    await submitFn[mode]();
  }

  const canCreateNeighbourhoodGroup = features.active.availableNeighbourhoodGroups > 0;
  const maxMembersCount = neighbourhoodGroup
    ? features.active.maxSpotPerNeighbourhoodGroup
    : features.active.maxSpotPerGroup;

  return (
    <Modal open={props.open} onOpenChange={props.onOpenChange} className={'flex-col gap-6'}>
      <Form>
        {({ isValid, handleSubmit }) => (
          <>
            <ModalTitle text={titleText[mode]} />
            <View className="w-full flex-row items-center gap-2 px-2">
              <ThemedIcon
                name={'user-group'}
                component={FontAwesome6}
                size={14}
                color={colors.primary}
              />
              <Text className="font-semibold text-primary">
                {t('user.parking.memberMaxCount', {
                  memberCount: props.parking?.maxSpots ?? maxMembersCount,
                })}
              </Text>
            </View>
            <View className={'flex-col gap-2'}>
              <FormInput
                value={name}
                onValueChange={setName}
                placeholder={t('user.parking.parkingName')}
                maxLength={50}
                validators={[validators.required]}
              />
              <FormInput
                value={address}
                onValueChange={setAddress}
                placeholder={t('user.parking.parkingAddress')}
                maxLength={100}
                validators={[validators.required]}
              />
              {mode === 'create' && (
                <FormInput
                  value={lotName}
                  onValueChange={setLotName}
                  placeholder={t('user.parking.parkingLotname')}
                  maxLength={10}
                  validators={[validators.required]}
                />
              )}
            </View>

            {mode === 'edit' && (
              <>
                {!wantToDeleteParking && !keyboardVisible && (
                  <Pressable
                    className={'mx-auto w-fit'}
                    onPress={() => setWantToDeleteParking(true)}>
                    <Text className={'mx-auto text-center text-destructive'}>
                      {t('common.delete')}
                    </Text>
                  </Pressable>
                )}
                {wantToDeleteParking && (
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
                {wantToDeleteParking && !keyboardVisible && (
                  <ExpandRow>
                    <ExpandItem>
                      <Button variant={'tonal'} onPress={() => setWantToDeleteParking(false)}>
                        <Text>{t('user.parking.cancelDelete')}</Text>
                      </Button>
                    </ExpandItem>
                    <ExpandItem>
                      <Button
                        disabled={confirmedParkingName !== props.parking?.name}
                        variant={'plain'}
                        onPress={() => props.parking && deleteParking(props.parking.id)}>
                        {isDeleting && <ActivityIndicator color={colors.destructive} />}
                        <Text className={'text-destructive'}>
                          {t('user.parking.confirmDelete')}
                        </Text>
                      </Button>
                    </ExpandItem>
                  </ExpandRow>
                )}
              </>
            )}

            {mode === 'create' && (
              <Card className={'flex-row items-center justify-between'}>
                <Text className={'text-primary'}>
                  {t('user.parking.addMoreMembers', {
                    memberCount: features.plans.neighbourhood.specs.maxSpotPerNeighbourhoodGroup,
                  })}
                </Text>

                <Switch
                  value={neighbourhoodGroup}
                  onValueChange={setNeighbourhoodGroup}
                  trackColor={{ true: colors.primary }}
                />
              </Card>
            )}

            {!keyboardVisible && !wantToDeleteParking && (
              <PremiumButton
                premiumContent={
                  <Text>
                    {t('user.parking.unlockMoreNeighbourhoodGroups', {
                      available: features.active.availableNeighbourhoodGroups,
                      max: features.active.maxNeighbourhoodGroups,
                    })}
                  </Text>
                }
                size={'lg'}
                hasNoAccess={neighbourhoodGroup && !canCreateNeighbourhoodGroup}
                disabled={!isValid}
                onPress={handleSubmit(onSubmit)}>
                {isSubmitting[mode] && <ActivityIndicator color={colors.foreground} />}
                <Text>{submitText[mode]}</Text>
              </PremiumButton>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
}

function ParkingBottomSheet(props: {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
  const { userProfile } = useCurrentUser();
  const [currentSpotName, setCurrentSpotName] = useState(userProfile.spot?.name);
  const [step, setStep] = useState<'selectParkingOption' | 'searchGroup'>('selectParkingOption');
  const [confirmLeaveGroup, setConfirmLeaveGroup] = useState(false);

  const { colors } = useColorScheme();
  const { t } = useTranslation();

  const [search, setSearch] = useState<string>();
  const [inputFocused, setInputFocused] = useState<'search' | 'spotName' | null>(null);
  const searchParking = useSearchParking();

  const [defineSpot, isUpdating] = useLoading(useRefreshOnSuccess(useDefineSpot()), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });

  const fullSearch = useMemo(
    () => search ?? userProfile.spot?.parking.name ?? '',
    [search, userProfile.spot?.parking.name]
  );
  const [searchDebounce] = useDebounce(fullSearch, 200);
  const [parking] = useFetch(() => searchParking(searchDebounce), [searchDebounce]);
  const [selectedParking, setSelectedParking] = useState<ParkingResponse>();
  const [editingParking, setEditingParking] = useState<ParkingResponse | null>(null);
  const [parkingModalOpen, setParkingModalOpen] = useState(false);
  const [openParkingModal, setOpenParkingModal] = useState(false);

  const router = useRouter();

  const spotNameRef = createRef<ReactTextInput>();
  const { keyboardVisible } = useKeyboardVisible();

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
      setStep('selectParkingOption');
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

  function initiateParkingCreation() {
    setParkingModalOpen(true);
    setEditingParking(null);
  }

  function onParkingEdit(parking: ParkingResponse) {
    setEditingParking(parking);
    setParkingModalOpen(true);
  }

  const maximizeSearch = inputFocused === 'search' && keyboardVisible;

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
      icon: <KnownIcon name={'search'} color={colors.primary} />,
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
      case 'selectParkingOption':
        return (
          <>
            <SheetTitle
              className={'items-center justify-between'}
              icon={
                userProfile.spot?.parking.isNeighbourhood && (
                  <KnownIcon name={'premium'} size={24} />
                )
              }
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
                        numberOfLines={2}
                        ellipsizeMode={'clip'}
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
          </>
        );
      case 'searchGroup':
        return (
          <>
            <View className={cn('flex-col gap-2')}>
              <DynamicBottomSheetTextInput>
                <TextInput
                  icon={{
                    position: 'left',
                    element: <KnownIcon name={'search'} />,
                  }}
                  textContentType={'addressCityAndState'}
                  editable={true}
                  value={fullSearch}
                  onChangeText={setSearch}
                  onPress={() => setSearch('')}
                  placeholder={t('user.parking.openOptions.searchGroup')}
                  onFocus={() => setInputFocused('search')}
                  onBlur={() => setInputFocused(null)}
                />
              </DynamicBottomSheetTextInput>
              <CardContainer className={cn('h-72', maximizeSearch && 'h-full')}>
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

            <>
              <View className="flex-col gap-8">
                <View className="w-full flex-row items-center justify-between gap-4">
                  <Text disabled={!selectedParking} className="disabled:opacity-50">
                    {t('common.spot.numberLabel')}
                  </Text>
                  <DynamicBottomSheetTextInput>
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
                      onFocus={() => setInputFocused('spotName')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </DynamicBottomSheetTextInput>
                </View>
              </View>

              <Button
                disabled={!selectedParking || !currentSpotName || isUpdating}
                onPress={() => updateParking()}
                size={'lg'}>
                {isUpdating && <ActivityIndicator color={colors.foreground} />}
                <Text className="text-white">{t('common.save')}</Text>
              </Button>
            </>
          </>
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
        onOk={() => props.onOpenChange(false)}
      />

      <DynamicBottomSheet open={props.open} onOpenChange={props.onOpenChange}>
        {SheetContent()}
      </DynamicBottomSheet>
    </>
  );
}

function ParkingCard(props: {
  isSelected: boolean;
  parking: ParkingResponse;
  onSelect: () => void;
}) {
  const { colors } = useColorScheme();
  const { userProfile } = useCurrentUser();

  return (
    <Pressable disabled={props.parking.isFull} onPress={props.onSelect}>
      <Card highlight={props.isSelected}>
        <View className={'flex-row items-center justify-between gap-2'}>
          {props.parking.ownerId === userProfile.id && (
            <ThemedIcon name={'hammer'} component={FontAwesome6} />
          )}
          {props.parking.isNeighbourhood && <KnownIcon name={'premium'} />}
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
