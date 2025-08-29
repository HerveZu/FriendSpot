import { PropsWithChildren } from 'react';
import { finishTransaction, useIAP } from 'expo-iap';
import { useActivateProduct } from '~/endpoints/me/activate-product';

export function ActivateIapProducts(props: PropsWithChildren) {
  const activateProduct = useActivateProduct();

  useIAP({
    onPurchaseSuccess: async (purchase) => {
      if (!purchase.transactionId || !purchase.purchaseToken) {
        console.warn('Transaction is missing required fields to be processed: ', purchase);
        return;
      }

      console.log('Activating product', {
        transactionId: purchase.transactionId,
        productId: purchase.productId,
      });
      await activateProduct({
        transactionId: purchase.transactionId,
        purchaseToken: purchase.purchaseToken,
        provider: purchase.platform === 'ios' ? 'appstore' : 'playstore',
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
