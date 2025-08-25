import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import { Card } from '~/components/Card';
import { Text } from '~/components/nativewindui/Text';
import { Button } from '~/components/nativewindui/Button';
import { useTranslation } from 'react-i18next';
import { ThemedIcon } from '~/components/ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { ProductCommon, useIAP } from 'expo-iap';
import { Linking, View } from 'react-native';
import { Loader } from '~/components/Loader';

const subscriptionInfoMap: {
  [sku: string]: {
    i18nKey: string;
    icon: ReactElement;
    inheritSubscriptionSku?: string;
  };
} = {
  'com.friendspot.subscriptions.premium': {
    i18nKey: 'premium',
    icon: <ThemedIcon name={'crown'} component={FontAwesome6} size={16} />,
  },
  'com.friendspot.subscriptions.neighbourhood': {
    inheritSubscriptionSku: 'com.friendspot.subscriptions.premium',
    i18nKey: 'neighbourhood',
    icon: <ThemedIcon name={'house'} component={FontAwesome6} size={16} />,
  },
  'com.friendspot.subscriptions.administrator': {
    inheritSubscriptionSku: 'com.friendspot.subscriptions.neighbourhood',
    i18nKey: 'administrator',
    icon: <ThemedIcon name={'building-user'} component={FontAwesome6} size={16} />,
  },
};

export default function FriendspotPlus() {
  const { t } = useTranslation();
  const { connected, requestProducts, subscriptions, availablePurchases, hasActiveSubscriptions } =
    useIAP();
  const [ready, setReady] = useState(false);
  const [validSubscriptionIds, setValidSubscriptionIds] = useState<string[]>();

  useEffect(() => {
    if (!connected) return;

    const skus = Object.keys(subscriptionInfoMap);

    console.log('Fetching subscriptions', skus);
    requestProducts({ skus: skus, type: 'subs' })
      .then(() => setReady(true))
      .catch(console.error);
  }, [connected]);

  useEffect(() => {
    Promise.all(
      availablePurchases.map(async (purchase) => {
        const active = await hasActiveSubscriptions([purchase.productId]);
        return active ? purchase.productId : null;
      })
    ).then((activeSubscriptionIds) =>
      setValidSubscriptionIds(activeSubscriptionIds.filter((x) => !!x).map((x) => x!))
    );
  }, [availablePurchases, hasActiveSubscriptions, setValidSubscriptionIds]);

  return (
    <ScreenWithHeader>
      <ScreenTitle title={t('friendspotplus.title')} wallet={false} />
      {ready ? (
        <View className={'flex-col gap-6'}>
          {subscriptions
            .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
            .map((product, i) => (
              <SubscriptionCard
                key={i}
                product={product}
                {...subscriptionInfoMap[product.id]}
                inheritProduct={
                  subscriptions.find(
                    (x) => x.id === subscriptionInfoMap[product.id].inheritSubscriptionSku
                  ) ?? null
                }
                isAvailable={!validSubscriptionIds?.includes(product.id)}
              />
            ))}
          <SubscriptionCard
            icon={<ThemedIcon name={'unlock'} component={FontAwesome6} size={16} />}
            i18nKey={'custom'}
            product={null}
            inheritProduct={
              subscriptions.find((x) => x.id === 'com.friendspot.subscriptions.administrator') ??
              null
            }
            isAvailable={true}
          />
        </View>
      ) : (
        <Loader />
      )}
    </ScreenWithHeader>
  );
}

function SubscriptionCard({
  icon,
  i18nKey,
  product,
  inheritProduct,
  isAvailable,
}: {
  i18nKey: string;
  icon: ReactElement;
  product: ProductCommon | null;
  inheritProduct: ProductCommon | null;
  isAvailable: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useColorScheme();
  const { requestPurchase } = useIAP();

  const features = useMemo(() => {
    const newEntries = t(`friendspotplus.plans.${i18nKey}.features`).split(';');

    return inheritProduct
      ? [
          t('friendspotplus.plans.everythingIn', { product: inheritProduct.displayName }),
          ...newEntries,
        ]
      : newEntries;
  }, [t, i18nKey, inheritProduct]);

  async function purchase(product: ProductCommon) {
    console.log('Purchasing product', {
      product: product.displayName,
      sku: product.id,
    });
    await requestPurchase({
      type: 'subs',
      request: {
        ios: {
          sku: product.id,
        },
        android: {
          skus: [product.id],
        },
      },
    }).catch(console.error);
  }

  async function contactUs() {
    const url = 'mailto:?subject=Friendspot Plus';
    await Linking.openURL(url);
  }

  return (
    <Card>
      <View className={'flex-row items-center justify-between'}>
        <View className={'flex-row items-center gap-2'}>
          {icon}
          <Text variant={'heading'}>
            {product?.displayName ?? t(`friendspotplus.plans.${i18nKey}.name`)}
          </Text>
        </View>

        {product && (
          <View className={'flex-row items-center gap-1'}>
            <Text className={'text-xl font-bold text-primary'}>{product.displayPrice}</Text>
            <Text>{t(`friendspotplus.plans.${i18nKey}.period`)}</Text>
          </View>
        )}
      </View>
      <Text>{product?.description ?? t(`friendspotplus.plans.${i18nKey}.description`)}</Text>
      <View className={'flex-col gap-2'}>
        {features.map((feature, i) => (
          <View key={i} className={'flex-row items-center gap-2'}>
            <ThemedIcon name={'check'} size={20} color={colors.primary} />
            <Text className={'font-semibold text-primary'}>{feature}</Text>
          </View>
        ))}
      </View>
      <Button
        variant={'primary'}
        disabled={!isAvailable}
        onPress={() => (product ? purchase(product) : contactUs())}>
        {!isAvailable && <ThemedIcon name={'lock'} component={FontAwesome6} />}
        <Text>
          {product
            ? t(`friendspotplus.plans.upgradeButton`, { product: product.displayName })
            : t(`friendspotplus.plans.${i18nKey}.upgradeButton`)}
        </Text>
      </Button>
    </Card>
  );
}
