import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
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

import { BottomSheetView } from '@gorhom/bottom-sheet';
import { ContentSheetView } from '~/components/ContentView';
import { SheetTitle } from '~/components/Title';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { ThemedIcon } from '~/components/ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';
import { useKeyboardVisible } from '~/lib/useKeyboardVisible';
import { ExpandItem, ExpandRow } from '~/components/ExpandItem';

export default function JoinParking() {
  const { code: initialCode } = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(initialCode || '');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const searchParking = useSearchParking();
  const { dismiss: dismissUserSpotCheck } = useContext(UserSpotCheckContext);
  const [hasResetCode, setHasResetCode] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useColorScheme();

  useEffect(() => {
    if (!hasResetCode && initialCode && initialCode !== code) {
      setCode(initialCode);
    }
  }, [initialCode, code, hasResetCode]);

  const [parking, , isSearching] = useFetch(
    () => (code ? searchParking(code).then((results) => results[0] ?? null) : null),
    [code]
  );

  useEffect(() => {
    if (parking) {
      setConfirmModalOpen(true);
    }
  }, [parking]);

  function dismissCheckAndGo() {
    dismissUserSpotCheck();
    router.replace('/');
  }

  function resetCode() {
    setHasResetCode(true);
    setCode('');
    setConfirmModalOpen(false);
  }

  return (
    <View className="h-full items-center justify-around">
      <View className="flex items-center justify-center gap-8 p-4">
        <Text className="text-3xl font-bold">{t('user.parking.joinParking.title')}</Text>
        <Text className="text-center text-base">{t('user.parking.joinParking.description')}</Text>

        <CodeEntry
          code={code}
          setCode={setCode}
          error={!parking && code.length > 0 && !isSearching}
        />
      </View>

      <Button onPress={dismissCheckAndGo} variant={'tonal'} size={'md'}>
        <Text>{t('user.parking.joinParking.dismissCheck')}</Text>
        <ThemedIcon
          name={'arrow-right'}
          color={Platform.select({ ios: colors.primary })}
          size={14}
        />
      </Button>

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

  useEffect(() => {
    if (code && code !== internalCode) {
      setInternalCode(appendCodePrefix(code));
    }
  }, [code]);

  useEffect(() => {
    if (internalCode.length === CELL_COUNT + PARKING_PREFIX.length) {
      setCode(internalCode);
      return;
    }

    if (internalCode.length === PARKING_PREFIX.length) {
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
          value={removeCodePrefix(internalCode)}
          onChangeText={(code) => setInternalCode(appendCodePrefix(code))}
          cellCount={CELL_COUNT + PARKING_PREFIX.length} // trick to avoid code size limitation when includes the prefix
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
                  error ? 'border-destructive' : ''
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
  const MAX_SPOT_PER_GROUP = 10;
  const { t } = useTranslation();
  const [step, setStep] = useState<'confirm' | 'spot'>('confirm');
  const [lotName, setLotName] = useState('');
  const [defineSpot, isLoading] = useLoading(useDefineSpot(), { beforeMarkingComplete: onClose });
  const { refreshProfile } = useCurrentUser();
  const bottomSheetModalRef = useSheetRef();
  const { keyboardVisible, keyboardHeight } = useKeyboardVisible();
  const { colors } = useColorScheme();

  useEffect(() => {
    if (open) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [open]);

  async function handleJoin() {
    await defineSpot({ parkingId: parking.id, lotName: lotName }).then(refreshProfile);
    onJoin();
  }

  const groupIsFull = parking.spotsCount >= MAX_SPOT_PER_GROUP;

  const content = () => {
    switch (step) {
      case 'confirm':
        return (
          <>
            <View className={'flex-col gap-6'}>
              <View className="flex-row items-center justify-between">
                <SheetTitle className={'text-3xl'}>{parking.name}</SheetTitle>
                <View className="flex-row items-end gap-1">
                  <Text
                    className={cn(
                      'text-3xl font-bold text-primary',
                      groupIsFull && 'text-destructive'
                    )}>
                    {parking.spotsCount}
                  </Text>

                  <View className={'flex-row items-center gap-1'}>
                    <Text className="text-lg font-semibold text-foreground">
                      /{MAX_SPOT_PER_GROUP}
                    </Text>
                    <ThemedIcon name="user" className="text-primary" />
                  </View>
                </View>
              </View>
              <Text className="text-xl">{parking.address}</Text>
            </View>
            <ExpandRow>
              <ExpandItem>
                <Button variant="tonal" onPress={onClose}>
                  <Text>{t('common.cancel')}</Text>
                </Button>
              </ExpandItem>
              <ExpandItem>
                <Button onPress={() => setStep('spot')} disabled={groupIsFull}>
                  <Text>{t('user.parking.joinParking.join')}</Text>
                  {groupIsFull ? (
                    <ThemedIcon name="lock" />
                  ) : (
                    <ThemedIcon name="arrow-right" size={14} />
                  )}
                </Button>
              </ExpandItem>
            </ExpandRow>
          </>
        );
      case 'spot':
        return (
          <>
            <View className={'gap-3'}>
              <SheetTitle className="text-2xl">
                {t('user.parking.joinParking.spot.title')}
              </SheetTitle>
              <Text>{t('user.parking.joinParking.spot.description')}</Text>
            </View>

            <TextInput
              value={lotName}
              onChangeText={setLotName}
              maxLength={10}
              placeholder={t('user.parking.joinParking.spot.placeholder')}
            />

            <ExpandRow>
              <ExpandItem>
                <Button variant="tonal" onPress={() => setStep('confirm')}>
                  <Text>{t('common.back')}</Text>
                </Button>
              </ExpandItem>
              <ExpandItem>
                <Button
                  variant="primary"
                  disabled={isLoading || lotName.trim() === ''}
                  onPress={handleJoin}>
                  {isLoading && <ActivityIndicator color={colors.foreground} />}
                  <Text>{t('common.submit')}</Text>
                </Button>
              </ExpandItem>
            </ExpandRow>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Sheet
      ref={bottomSheetModalRef}
      enableDynamicSizing={false}
      onDismiss={onClose}
      snapPoints={keyboardVisible ? ['80%'] : ['40%']}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore">
      <BottomSheetView
        className="flex-1"
        style={{
          paddingBottom: keyboardHeight,
        }}>
        <ContentSheetView className="mx-auto flex-1 flex-col justify-between">
          {content()}
        </ContentSheetView>
      </BottomSheetView>
    </Sheet>
  );
}
