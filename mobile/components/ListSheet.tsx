import { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { Dispatch, PropsWithChildren, ReactNode, SetStateAction, useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ContentSheetView } from '~/components/ContentView';
import { SheetTitle } from '~/components/Title';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';

export function ListSheet(
  props: {
    title: string;
    action: ReactNode;
    open: boolean;
    onOpen: Dispatch<SetStateAction<boolean>>;
  } & PropsWithChildren
) {
  const ref = useSheetRef();

  useEffect(() => {
    if (props.open) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [ref.current, props.open]);

  return (
    <Sheet ref={ref} onDismiss={() => props.onOpen(false)} topInset={150}>
      <BottomSheetView>
        <ContentSheetView className="flex-col justify-between gap-8 pt-4">
          <SheetTitle>{props.title}</SheetTitle>
          <ScrollView>
            <View className="flex-col gap-4">{props.children}</View>
          </ScrollView>
          <Pressable onPress={() => props.onOpen(false)}>{props.action}</Pressable>
        </ContentSheetView>
      </BottomSheetView>
    </Sheet>
  );
}
