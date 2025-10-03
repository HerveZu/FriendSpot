import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import { Card, CardTitle } from '~/components/Card';
import { Text } from '~/components/nativewindui/Text';
import { useTranslation } from 'react-i18next';
import { ThemedIcon } from '~/components/ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';
import {
  createContext,
  Dispatch,
  ReactElement,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { ProductCommon, useIAP } from 'expo-iap';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Loader } from '~/components/Loader';
import { useCurrentUser } from '~/authentication/UserProvider';
import { ContactUsButton } from '~/components/ContactUsButton';
import { useGetPlanInfo } from '~/components/FriendspotPlus';
import { SubscriptionProduct } from 'expo-iap/src/ExpoIap.types';
import { ProductSubscriptionAndroid } from 'expo-iap/src/types/ExpoIapAndroid.types';
import { RefreshTriggerContext } from '~/authentication/RefreshTriggerProvider';

const PurchaseContext = createContext<{
  purchasePending: boolean;
  setPurchasePending: Dispatch<SetStateAction<boolean>>;
}>(null!);

export default function FriendspotPlus() {
  const { t } = useTranslation();
  const { connected, requestProducts, subscriptions, availablePurchases } = useIAP({
    shouldAutoSyncPurchases: true,
  });
  const [ready, setReady] = useState(false);
  const { features } = useCurrentUser();
  const getPlanInfo = useGetPlanInfo();
  const { refreshTrigger } = useContext(RefreshTriggerContext);
  const [isPendingPurchase, setIsPendingPurchase] = useState(false);

  useEffect(() => {
    if (!connected) return;

    const productIds = Object.values(features.plans).map((plan) => plan.productId);

    console.log('Requesting products', productIds);
    requestProducts({ skus: productIds, type: 'subs' })
      .then(() => setReady(true))
      .catch(console.error);
  }, [connected, refreshTrigger, availablePurchases]);

  return (
    <ScreenWithHeader>
      <ScreenTitle title={t('friendspotplus.title')} wallet={false} />
      <PurchaseContext.Provider
        value={{ setPurchasePending: setIsPendingPurchase, purchasePending: isPendingPurchase }}>
        {ready ? (
          <View className={'flex-col gap-6'}>
            {subscriptions
              .map((product) => ({ product, info: getPlanInfo(product.id) }))
              .filter((x) => !!x.info)
              .sort((a, b) => a.info!.order - b.info!.order)
              .map(
                ({ product, info }, i) =>
                  info && (
                    <SubscriptionCard
                      key={i}
                      product={product}
                      {...info}
                      inheritProduct={
                        subscriptions.find((x) => x.id === info.inheritSubscriptionSku) ?? null
                      }
                    />
                  )
              )}
          </View>
        ) : (
          <Loader />
        )}
      </PurchaseContext.Provider>
    </ScreenWithHeader>
  );
}

function SubscriptionCard({
  icon,
  i18nKey,
  product,
  inheritProduct,
}: {
  i18nKey: string;
  icon: ReactElement;
  product: SubscriptionProduct | null;
  inheritProduct: SubscriptionProduct | null;
}) {
  const { t } = useTranslation();
  const { colors } = useColorScheme();
  const { requestPurchase } = useIAP({ shouldAutoSyncPurchases: true });

  const [thisPurchaseIsPending, setThisPurchaseIsPending] = useState(false);
  const { purchasePending, setPurchasePending } = useContext(PurchaseContext);
  const { features, refreshProfile } = useCurrentUser();

  const isAvailable = useMemo(() => {
    const featureActiveMap = {
      [features.plans.neighbourhood.productId]: features.isNeighbourhood,
      [features.plans.premium.productId]: features.isPremium,
    };

    return (product && !featureActiveMap[product.id]) ?? true;
  }, [features, product]);

  const benefits = useMemo(() => {
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

    setThisPurchaseIsPending(true);
    setPurchasePending(true);

    try {
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
                  android: () =>
                    (product as ProductSubscriptionAndroid).subscriptionOfferDetailsAndroid[0]
                      .offerToken,
                  default: () => '',
                })(),
              },
            ],
          },
        },
      });
      console.log('Product purchased');
      await refreshProfile();
    } catch (e) {
      console.error('Failed to purchase', e);
    } finally {
      setThisPurchaseIsPending(false);
      setPurchasePending(false);
    }
  }

  return (
    <Card>
      <View className={'flex-row items-center justify-between'}>
        <View className={'flex-row items-center gap-2'}>
          {icon}
          <CardTitle>{product?.displayName ?? t(`friendspotplus.plans.${i18nKey}.name`)}</CardTitle>
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
        {benefits.map((feature, i) => (
          <View key={i} className={'flex-row items-center gap-2'}>
            <ThemedIcon name={'check'} size={20} color={colors.primary} />
            <Text className={'font-semibold text-primary'}>{feature}</Text>
          </View>
        ))}
      </View>
      <ContactUsButton
        variant={'primary'}
        disabled={!isAvailable || purchasePending || Platform.OS === 'android'} // payment are not working on android
        contactUsDisabled={!!product}
        onPress={() => product && purchase(product)}>
        {!isAvailable && <ThemedIcon name={'lock'} component={FontAwesome6} />}
        {thisPurchaseIsPending && <ActivityIndicator color={colors.foreground} />}
        <Text>
          {!isAvailable &&
            product &&
            t('friendspotplus.plans.alreadyUpgraded', { product: product.displayName })}
          {isAvailable &&
            (product
              ? t('friendspotplus.plans.upgradeButton', { product: product.displayName })
              : t(`friendspotplus.plans.${i18nKey}.upgradeButton`))}
        </Text>
      </ContactUsButton>
    </Card>
  );
}
