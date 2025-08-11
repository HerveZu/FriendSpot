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
import { useRouter } from 'expo-router';
import { TextInput } from '~/components/TextInput';

export default function JoinParking() {
  const [code, setCode] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const searchParking = useSearchParking();
  const { dismiss: dismissUserSpotCheck } = useContext(UserSpotCheckContext);
  const { t } = useTranslation();
  const router = useRouter();

  const [parking] = useFetch(
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
    router.replace('/my-spot');
  }

  function resetCode() {
    setCode('');
    setConfirmModalOpen(false);
  }

  return (
    <View className="flex-1 items-center justify-center gap-6 p-4">
      <Text className="text-xl font-bold">{t('parkingCode.title')}</Text>
      <CodeEntry code={code} setCode={setCode} error={parking === null} />

      <Button onPress={dismissCheckAndGo} variant={'plain'}>
        <Text>{t('parkingCode.dismissCheck')}</Text>
      </Button>

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

  useEffect(() => {
    if (internalCode.length === CELL_COUNT + PARKING_PREFIX.length) {
      setCode(internalCode);
      return;
    }

    if (internalCode.length === 0) {
      setCode('');
    }
  }, [internalCode, setCode]);

  useEffect(() => {
    internalCode !== code && setInternalCode(code);
  }, [code, setInternalCode]);

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
                  error && 'border-destructive'
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
          <>
            <ModalTitle text={t('parking.joinModal.confirm.title')} />

            <View className="gap-4">
              <Text className="text-base font-semibold">{parking.name}</Text>

              <View className="flex-row gap-3">
                <Button variant="secondary" onPress={onClose}>
                  <Text>{t('common.cancel')}</Text>
                </Button>
                <Button onPress={() => setStep('spot')}>
                  <Text>{t('common.next')}</Text>
                </Button>
              </View>
            </View>
          </>
        );
      case 'spot':
        return (
          <>
            <ModalTitle text={t('parking.joinModal.spot.title')} />

            <TextInput value={lotName} onChangeText={setLotName} />
            <Button variant="primary" disabled={isLoading} onPress={handleJoin}>
              {isLoading ? <ActivityIndicator /> : <Text>{t('common.confirm')}</Text>}
            </Button>
          </>
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
