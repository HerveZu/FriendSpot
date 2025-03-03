import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {getAndroidId, getIosIdForVendorAsync} from 'expo-application';

const getIdFunc: () => Promise<string | null> =
    Platform.OS === 'ios' ? getIosIdForVendorAsync : async () => getAndroidId();

export function useDeviceId(): string | undefined {
    const [deviceId, setDeviceId] = useState<string>();
    console.log(deviceId);
    useEffect(() => {
        getIdFunc().then((deviceId) => deviceId && setDeviceId(deviceId));
    }, []);

    return deviceId;
}
