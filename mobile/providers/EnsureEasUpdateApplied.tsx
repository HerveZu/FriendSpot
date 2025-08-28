import { PropsWithChildren } from 'react';
import * as Updates from 'expo-updates';
import { View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { Button } from '~/components/nativewindui/Button';
import { ThemedIcon } from '~/components/ThemedIcon';
import { useTranslation } from 'react-i18next';
import { FontAwesome6 } from '@expo/vector-icons';

export function EnsureEasUpdateApplied(props: PropsWithChildren) {
  const easUpdates = Updates.useUpdates();
  const { t } = useTranslation();

  return (
    <>
      {easUpdates.isUpdateAvailable && (
        <View className={'pt-safe absolute z-50 bg-primary p-6'}>
          <View className={'w-full flex-row items-center justify-between'}>
            <Text variant={'callout'}>{t('common.updateAvailable.message')}</Text>

            <Button onPress={Updates.reloadAsync} variant={'plain'}>
              <ThemedIcon name={'cloud-arrow-down'} component={FontAwesome6} size={14} />
              <Text>{t('common.updateAvailable.reload')}</Text>
            </Button>
          </View>
        </View>
      )}
      {props.children}
    </>
  );
}
