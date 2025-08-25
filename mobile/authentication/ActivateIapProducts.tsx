import { PropsWithChildren } from 'react';
import { finishTransaction, useIAP } from 'expo-iap';
import { useActivateProduct } from '~/endpoints/me/activate-product';
import { Platform } from 'react-native';

export function ActivateIapProducts(props: PropsWithChildren) {
  const activatePurchase = useActivateProduct();

  useIAP({
    onPurchaseSuccess: async (purchase) => {
      if (!purchase.purchaseToken) {
        console.warn('No purchase token found for purchase: ', purchase.productId);
        return;
      }

      console.log('Activating product', { productId: purchase.productId });
      await activatePurchase({
        sku: purchase.productId,
        transactionId: purchase.transactionId,
        provider: Platform.OS === 'ios' ? 'appstore' : 'playstore',
      });
      await finishTransaction({ purchase });
      console.log('Product successfully activated: ', { productId: purchase.productId });
    },
  });

  return props.children;
}
