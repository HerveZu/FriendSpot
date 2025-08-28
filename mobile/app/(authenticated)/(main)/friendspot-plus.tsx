import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import { Card } from '~/components/Card';
import { Text } from '~/components/nativewindui/Text';
import { useTranslation } from 'react-i18next';
import { ThemedIcon } from '~/components/ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';
import { ReactElement, useContext, useEffect, useMemo, useState } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { ProductCommon, useIAP } from 'expo-iap';
import { Platform, View } from 'react-native';
import { Loader } from '~/components/Loader';
import { useCurrentUser } from '~/authentication/UserProvider';
import { ContactUsButton } from '~/components/ContactUsButton';
import { useGetPlanInfo } from '~/components/FriendspotPlus';
import { SubscriptionProduct } from 'expo-iap/src/ExpoIap.types';
import { ProductSubscriptionAndroid } from 'expo-iap/src/types/ExpoIapAndroid.types';
import { RefreshTriggerContext } from '~/authentication/RefreshTriggerProvider';

export default function FriendspotPlus() {
  const { t } = useTranslation();
  const { connected, requestProducts, subscriptions, availablePurchases, hasActiveSubscriptions } =
    useIAP();
  const [ready, setReady] = useState(false);
  const [validSubscriptionIds, setValidSubscriptionIds] = useState<string[]>();
  const { features } = useCurrentUser();
  const getPlanInfo = useGetPlanInfo();
  const { refreshTrigger } = useContext(RefreshTriggerContext);

  useEffect(() => {
    if (!connected) return;

    const productIds = Object.values(features.plans).map((plan) => plan.productId);

    console.log('Requesting products', productIds);
    requestProducts({ skus: productIds, type: 'subs' })
      .then(() => setReady(true))
      .catch(console.error);
  }, [connected, refreshTrigger]);

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
            .map((product, i) => {
              const info = getPlanInfo(product.id);

              return (
                info && (
                  <SubscriptionCard
                    key={i}
                    product={product}
                    {...info}
                    inheritProduct={
                      subscriptions.find((x) => x.id === info.inheritSubscriptionSku) ?? null
                    }
                    isAvailable={!validSubscriptionIds?.includes(product.id)}
                  />
                )
              );
            })}
          <SubscriptionCard
            icon={<ThemedIcon name={'unlock'} component={FontAwesome6} size={16} />}
            i18nKey={'custom'}
            product={null}
            inheritProduct={
              subscriptions.find((x) => x.id === features.plans.neighbourhood.productId) ?? null
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
  product: SubscriptionProduct | null;
  inheritProduct: SubscriptionProduct | null;
  isAvailable: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useColorScheme();
  const { requestPurchase } = useIAP();

  const features = useMemo(() => {
    const features = t(`friendspotplus.plans.${i18nKey}.features`, {
      returnObjects: true,
    }) as string[];

    return inheritProduct
      ? [
          t('friendspotplus.plans.everythingIn', { product: inheritProduct.displayName }),
          ...features,
        ]
      : features;
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
          subscriptionOffers: [
            {
              sku: product.id,
              offerToken: Platform.select({
                android: (product as ProductSubscriptionAndroid).subscriptionOfferDetailsAndroid[0]
                  .offerToken,
                default: '',
              }),
            },
          ],
        },
      },
    }).catch(console.error);
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
      <ContactUsButton
        variant={'primary'}
        disabled={!isAvailable}
        contactUsDisabled={!!product}
        onPress={() => product && purchase(product)}>
        {!isAvailable && <ThemedIcon name={'lock'} component={FontAwesome6} />}
        <Text>
          {product
            ? t(`friendspotplus.plans.upgradeButton`, { product: product.displayName })
            : t(`friendspotplus.plans.${i18nKey}.upgradeButton`)}
        </Text>
      </ContactUsButton>
    </Card>
  );
}
