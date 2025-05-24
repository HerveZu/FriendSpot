import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getAndroidId, getIosIdForVendorAsync } from 'expo-application';

const getIdFunc: () => Promise<DeviceInfo> =
  Platform.OS === 'ios'
    ? async () =>
        ({ deviceId: await getIosIdForVendorAsync(), uniquenessNotGuaranteed: true }) as DeviceInfo
    : async () => ({ deviceId: getAndroidId(), uniquenessNotGuaranteed: true }) as DeviceInfo; // find a way to get a truly unique id on android

type DeviceInfo = {
  deviceId: string | null;
  uniquenessNotGuaranteed: boolean;
};

export function useDeviceId(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>({
    deviceId: null,
    uniquenessNotGuaranteed: false,
  });

  useEffect(() => {
    getIdFunc().then((device) => device && setDevice(device));
  }, []);

  return device;
}
