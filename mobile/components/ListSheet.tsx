import { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { Dispatch, PropsWithChildren, ReactNode, SetStateAction, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';
import { ContentSheetView } from '~/components/ContentView';
import { List } from '~/components/List';
import { SheetTitle } from '~/components/Title';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { ScrollView } from 'react-native-gesture-handler';


export function ListSheet(
  props: {
    title: string;
    action?: ReactNode;
    open: boolean;
    onOpen: Dispatch<SetStateAction<boolean>>;
    setNextReservedSpot: Dispatch<SetStateAction<boolean>>;
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
    <Sheet
      ref={ref}
      onDismiss={() => {
        props.onOpen(false);
        props.setNextReservedSpot(false);
      }}
      topInset={150}>
      <BottomSheetView>
        <ContentSheetView className="flex-col justify-between gap-8">
          <View>
            <SheetTitle>{props.title}</SheetTitle>
          </View>
          <ScrollView>
            <List>{props.children}</List>
          </ScrollView>
          <Pressable onPress={() => props.onOpen(false)}>{props.action}</Pressable>
        </ContentSheetView>
      </BottomSheetView>
    </Sheet>
  );
}
