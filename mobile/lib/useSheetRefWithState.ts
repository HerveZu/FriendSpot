import { RefObject, useEffect } from 'react';
import { useSheetRef } from '~/components/nativewindui/Sheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

export function useSheetRefWithState(open: boolean): RefObject<BottomSheetModal | null> {
  const ref = useSheetRef();

  useEffect(() => {
    if (open) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [ref.current, open]);

  return ref;
}
