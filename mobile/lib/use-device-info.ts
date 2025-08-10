import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getAndroidId, getIosIdForVendorAsync } from 'expo-application';

const getIdFunc: () => Promise<DeviceInfo> =
  Platform.OS === 'ios'
    ? async () =>
        ({ deviceId: await getIosIdForVendorAsync(), uniquenessNotGuaranteed: true }) as DeviceInfo
    : async () => ({ deviceId: getAndroidId(), uniquenessNotGuaranteed: true }) as DeviceInfo; // find a way to get a truly unique id on android
export type DeviceInfo = {
  deviceId: string | null;
  uniquenessNotGuaranteed: boolean;
};

export function useDeviceInfo(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>({
    deviceId: null,
    uniquenessNotGuaranteed: false,
  });

  const fetchDeviceId = useCallback(async () => {
    return await getIdFunc().then((device) => device?.deviceId && setDevice(device));
  }, [setDevice]);

  useEffect(() => {
    fetchDeviceId().then((device) => !device && setTimeout(fetchDeviceId, 500));
  }, [fetchDeviceId]);

  return device;
}
