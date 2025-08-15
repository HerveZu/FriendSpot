import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Modal, ModalTitle } from '~/components/Modal';
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
    <View className="justify-top flex-1 items-center justify-around gap-6">
      {/* <Button onPress={() => router.back()} variant="plain">
        <ThemedIcon component={FontAwesome6} name="chevron-left" />
      </Button> */}
      <View className="flex items-center justify-center gap-6 rounded-xl border border-primary p-4">
        <Text className="text-2xl font-bold">{t('user.parking.parkingCode.title')}</Text>
        <Text className="text-center text-sm">{t('user.parking.parkingCode.description')}</Text>

        <CodeEntry code={code} setCode={setCode} error={!!noParking} />

        <Button onPress={dismissCheckAndGo} variant={'tonal'}>
          <Text className="text-xs">{t('user.parking.parkingCode.dismissCheck')}</Text>
        </Button>
      </View>

      {parking && (
        <ConfirmJoinModal
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

function ConfirmJoinModal({
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
  const [step, setStep] = useState<'confirm' | 'spot'>('confirm');
  const [lotName, setLotName] = useState('A12');
  const [defineSpot, isLoading] = useLoading(useDefineSpot());

  async function handleJoin() {
    await defineSpot({ parkingId: parking.id, lotName: lotName });
    onClose();
    onJoin();
  }

  const modalContent = () => {
    switch (step) {
      case 'confirm':
        return (
          <View className="flex gap-4">
            <ModalTitle text={t('user.parking.joinParking.title')} />
            <View className=" gap-2">
              <View className="">
                <Text className="text-lg text-primary">{t('user.parking.joinParking.name')}</Text>
                <Text className="text-base font-semibold">{parking.name}</Text>
              </View>
              <View className="">
                <Text className="text-lg text-primary">
                  {t('user.parking.joinParking.information')}
                </Text>
                <Text className="text-base font-semibold">{parking.address}</Text>
              </View>
              <View className="flex">
                <Text className="text-lg text-primary">
                  {t('user.parking.joinParking.spotCount')}
                </Text>
                <Text className="text-base font-semibold">{parking.spotsCount}</Text>
              </View>
            </View>

            <View className="w-full flex-row justify-center gap-4">
              <Button variant="secondary" onPress={onClose} className="flex-1">
                <Text>{t('common.cancel')}</Text>
              </Button>
              <Button onPress={() => setStep('spot')} className="flex-1">
                <Text>{t('common.next') + ' ' + '→'}</Text>
              </Button>
            </View>
          </View>
        );
      case 'spot':
        return (
          <View className="gap-4">
            <ModalTitle text={t('user.parking.joinParking.spot.title')} />

            <TextInput value={lotName} onChangeText={setLotName} placeholder="ABC123" />
            <View className="flex-row gap-4">
              <Button
                variant="secondary"
                disabled={isLoading}
                onPress={() => setStep('confirm')}
                className="flex-1">
                {isLoading ? <ActivityIndicator /> : <Text>{t('common.back')}</Text>}
              </Button>
              <Button
                variant="primary"
                disabled={isLoading}
                onPress={handleJoin}
                className="flex-1">
                {isLoading ? <ActivityIndicator /> : <Text>{t('common.submit')}</Text>}
              </Button>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal open={open} onOpenChange={() => onClose()} vibration>
      {modalContent()}
    </Modal>
  );
}
