import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import {
  CodeField,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { useSearchParking } from '~/endpoints/parkings/search-parking';
import { useDefineSpot } from '~/endpoints/parkings/define-spot';
import { useFetch, useLoading } from '~/lib/useFetch';
import { ParkingResponse } from '~/endpoints/parkings/parking-response';
import { useTranslation } from 'react-i18next';
import { cn } from '~/lib/cn';
import { UserSpotCheckContext } from '~/spots/EnsureUserHasSpot';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TextInput } from '~/components/TextInput';
import { useCurrentUser } from '~/authentication/UserProvider';

import { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ContentSheetView } from '~/components/ContentView';
import { SheetTitle } from '~/components/Title';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { ThemedIcon } from '~/components/ThemedIcon';

export default function JoinParking() {
  const { code: initialCode } = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(initialCode || '');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const searchParking = useSearchParking();
  const { dismiss: dismissUserSpotCheck } = useContext(UserSpotCheckContext);
  const [hasResetCode, setHasResetCode] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    if (!hasResetCode && initialCode && initialCode !== code) {
      setCode(initialCode);
    }
    console.log('code = ', code);
  }, [initialCode, code, hasResetCode]);

  const [parking] = useFetch(
    () => (code ? searchParking(code).then((results) => results[0] ?? null) : null),
    [code]
  );

  const noParking = parking === null;

  useEffect(() => {
    if (parking) {
      setConfirmModalOpen(true);
    }
  }, [parking]);

  function dismissCheckAndGo() {
    dismissUserSpotCheck();
    router.replace('/my-spot');
  }

  function resetCode() {
    setHasResetCode(true);
    setCode('');
    setConfirmModalOpen(false);
  }

  return (
    <View className="justify-top mt-36 items-center justify-around gap-6">
      <View className="flex items-center justify-center gap-6 p-4">
        <Text className="text-2xl font-bold">{t('user.parking.parkingCode.title')}</Text>
        <Text className="text-center text-sm">{t('user.parking.parkingCode.description')}</Text>

        <CodeEntry code={code} setCode={setCode} error={!!noParking} />

        <Button onPress={dismissCheckAndGo} variant={'tonal'}>
          <Text className="text-xs">{t('user.parking.parkingCode.dismissCheck')}</Text>
        </Button>
      </View>

      {parking && (
        <ConfirmJoinBottomSheet
          open={confirmModalOpen}
          onJoin={dismissCheckAndGo}
          onClose={resetCode}
          parking={parking}
        />
      )}
    </View>
  );
}

function CodeEntry({
  code,
  setCode,
  error,
}: {
  code: string;
  setCode: Dispatch<SetStateAction<string>>;
  error?: boolean;
}) {
  const PREFIX_SEPARATOR = '-';
  const PARKING_PREFIX = `P${PREFIX_SEPARATOR}`;
  const CELL_COUNT = 6;
  const [internalCode, setInternalCode] = useState(code);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (internalCode.length == 0) {
      setShowError(false);
    } else if (error) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [error, internalCode]);

  useEffect(() => {
    if (internalCode.length === CELL_COUNT + PARKING_PREFIX.length) {
      setCode(internalCode);
      return;
    }

    if (internalCode.length === 0) {
      setCode('');
    }
  }, [internalCode, setCode]);

  const removeCodePrefix = useCallback((code: string) => {
    const separatorIndex = code.lastIndexOf(PREFIX_SEPARATOR);
    return code.slice(separatorIndex + 1).toUpperCase();
  }, []);

  const appendCodePrefix = useCallback(
    (code: string) => {
      return `${PARKING_PREFIX}${removeCodePrefix(code)}`.toUpperCase();
    },
    [removeCodePrefix]
  );

  const ref = useBlurOnFulfill({ value: removeCodePrefix(internalCode), cellCount: CELL_COUNT });
  const [codeFieldProps, getCellOnLayoutHandler] = useClearByFocusCell({
    setValue: (code) => setInternalCode(appendCodePrefix(code)),
  });

  return (
    <View className="w-full items-center justify-center">
      <View className="flex-row items-center justify-center gap-3">
        <View className={'flex-row items-center gap-2'}>
          {[...PARKING_PREFIX].map((prefixChar, i) => (
            <Text key={i} className={'text-2xl font-bold tracking-widest'}>
              {prefixChar}
            </Text>
          ))}
        </View>

        <CodeField
          ref={ref as any}
          {...codeFieldProps}
          // trick to avoid code size limitation when includes the prefix
          value={removeCodePrefix(internalCode)}
          onChangeText={(code) => setInternalCode(appendCodePrefix(code))}
          cellCount={CELL_COUNT + PARKING_PREFIX.length}
          keyboardType="default"
          textContentType="oneTimeCode"
          rootStyle={{ gap: 6 }}
          renderCell={({ index, symbol, isFocused }) => {
            const paddingCell = index >= CELL_COUNT;
            if (paddingCell) return null;

            return (
              <View
                key={index}
                onLayout={getCellOnLayoutHandler(index)}
                className={cn(
                  'h-11 w-10 items-center justify-center rounded-lg border',
                  isFocused ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-muted',
                  showError ? 'border-destructive' : ''
                )}>
                <Text className="text-2xl font-bold tracking-widest">{symbol}</Text>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

function ConfirmJoinBottomSheet({
  open,
  onClose,
  onJoin,
  parking,
}: {
  open: boolean;
  onClose: () => void;
  onJoin: () => void;
  parking: ParkingResponse;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'confirm' | 'spot' | 'error'>('confirm');
  const [lotName, setLotName] = useState('');
  const [defineSpot, isLoading] = useLoading(useDefineSpot());
  const { refreshProfile } = useCurrentUser();
  const bottomSheetModalRef = useSheetRef();

  useEffect(() => {
    if (open) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [open]);

  async function handleJoin() {
    await defineSpot({ parkingId: parking.id, lotName: lotName }).then(refreshProfile);
    onClose();
    onJoin();
  }

  function checkNumberOfMembers() {
    if (parking.spotsCount >= 10) {
      setStep('error');
    } else setStep('spot');
  }

  const bottomSheetContent = () => {
    switch (step) {
      case 'confirm':
        return (
          <Sheet
            ref={bottomSheetModalRef}
            enableDynamicSizing={false}
            onDismiss={onClose}
            snapPoints={['40%', '40%']}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore">
            <BottomSheetView className="flex-1">
              <ContentSheetView className="mx-auto flex-1 flex-col">
                <BottomSheetScrollView
                  contentContainerStyle={{ padding: 16, rowGap: 16 }}
                  keyboardShouldPersistTaps="handled">
                  <View className="flex-row items-center justify-between">
                    <SheetTitle className="flex-row items-center text-3xl">
                      {parking.name}
                    </SheetTitle>
                    <View className="flex-row items-center gap-2">
                      <ThemedIcon name="user" size={22} className="text-primary" />
                      <Text className="text-lg font-medium text-primary">
                        <Text className="text-3xl font-bold text-primary">
                          {parking.spotsCount}{' '}
                        </Text>
                        <Text className="text-xl font-semibold text-foreground">/10</Text>
                      </Text>
                    </View>
                  </View>
                  <View className="mt-4">
                    <Text className=" text-xl">{parking.address}</Text>
                  </View>
                </BottomSheetScrollView>
                <View className="border-muted/20 flex-row items-center gap-4 border-t py-3">
                  <Button variant="tonal" onPress={onClose} className="flex-1 items-center">
                    <Text>{t('common.cancel')}</Text>
                  </Button>
                  <Button onPress={checkNumberOfMembers} className="flex-1 items-center">
                    <Text>{t('user.parking.joinParking.join') + ' →'}</Text>
                  </Button>
                </View>
              </ContentSheetView>
            </BottomSheetView>
          </Sheet>
        );
      case 'spot':
        return (
          <Sheet
            ref={bottomSheetModalRef}
            enableDynamicSizing={false}
            onDismiss={onClose}
            snapPoints={['40%', '40%']}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore">
            <BottomSheetView className="flex-1">
              <ContentSheetView className="flex-1">
                <BottomSheetScrollView
                  contentContainerStyle={{ padding: 16, rowGap: 16 }}
                  keyboardShouldPersistTaps="handled">
                  <View className="flex-row items-center justify-between">
                    <SheetTitle className="flex-row items-center">
                      {t('user.parking.joinParking.spot.title')}
                    </SheetTitle>
                  </View>
                  <TextInput value={lotName} onChangeText={setLotName} placeholder="Ex : 34" />
                </BottomSheetScrollView>

                <View className="border-muted/20 flex-row items-center gap-4 border-t py-3">
                  <Button
                    variant="tonal"
                    disabled={isLoading}
                    onPress={() => setStep('confirm')}
                    className="flex-1">
                    {isLoading ? <ActivityIndicator /> : <Text>{t('common.back')}</Text>}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={isLoading || lotName.trim() === ''}
                    onPress={handleJoin}
                    className="flex-1">
                    {isLoading ? <ActivityIndicator /> : <Text>{t('common.submit')}</Text>}
                  </Button>
                </View>
              </ContentSheetView>
            </BottomSheetView>
          </Sheet>
        );
      case 'error':
        return (
          <Sheet
            ref={bottomSheetModalRef}
            enableDynamicSizing={false}
            onDismiss={() => onClose}
            snapPoints={['40%', '40%']}>
            <BottomSheetView className="relative">
              <ContentSheetView className="h-full flex-col gap-4">
                <BottomSheetScrollView
                  contentContainerStyle={{ padding: 16, rowGap: 16 }}
                  keyboardShouldPersistTaps="handled">
                  <View className="flex-row items-center justify-between">
                    <SheetTitle className="text- flex-row items-center">
                      {t('user.parking.joinParking.error.title')}
                    </SheetTitle>
                    <View className="flex-row items-center gap-2">
                      <ThemedIcon name={'lock'} size={30} />
                    </View>
                  </View>
                  <Text>{t('user.parking.joinParking.error.description')}</Text>
                </BottomSheetScrollView>
                <View className="flex-row items-center gap-4 py-3">
                  <Button
                    variant="primary"
                    disabled={isLoading}
                    onPress={onClose}
                    className="w-full">
                    {isLoading ? <ActivityIndicator /> : <Text>{t('common.back')}</Text>}
                  </Button>
                </View>
              </ContentSheetView>
            </BottomSheetView>
          </Sheet>
        );
      default:
        return null;
    }
  };

  return bottomSheetContent();
}
