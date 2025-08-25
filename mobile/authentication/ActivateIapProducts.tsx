import { PropsWithChildren } from 'react';
import { finishTransaction, useIAP } from 'expo-iap';
import { useActivateProduct } from '~/endpoints/me/activate-product';
import { Platform } from 'react-native';

export function ActivateIapProducts(props: PropsWithChildren) {
  const activateProduct = useActivateProduct();

  useIAP({
    onPurchaseSuccess: async (purchase) => {
      if (!purchase.transactionId) {
        console.warn('No transaction id found for purchase: ', purchase.transactionId);
        return;
      }

      console.log('Activating product', {
        transactionId: purchase.transactionId,
        productId: purchase.productId,
      });
      await activateProduct({
        transactionId: purchase.transactionId,
        provider: Platform.OS === 'ios' ? 'appstore' : 'playstore',
      });
      await finishTransaction({ purchase });
      console.log('Product successfully activated: ', {
        transactionId: purchase.transactionId,
        productId: purchase.productId,
      });
    },
  });

  return props.children;
}
