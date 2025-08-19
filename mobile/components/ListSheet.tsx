import { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { Dispatch, PropsWithChildren, ReactNode, SetStateAction } from 'react';
import { Pressable } from 'react-native';

import { ContentSheetView } from '~/components/ContentView';
import { List } from '~/components/List';
import { SheetTitle } from '~/components/Title';
import { Sheet } from '~/components/nativewindui/Sheet';
import { ScrollView } from 'react-native-gesture-handler';
import { useSheetRefWithState } from '~/lib/useSheetRefWithState';

export function ListSheet(
  props: {
    title: string;
    action?: ReactNode;
    open: boolean;
    onOpen: Dispatch<SetStateAction<boolean>>;
    setNextReservedSpot: Dispatch<SetStateAction<boolean>>;
  } & PropsWithChildren
) {
  const ref = useSheetRefWithState(props.open);

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
          <SheetTitle>{props.title}</SheetTitle>
          <ScrollView>
            <List>{props.children}</List>
          </ScrollView>
          <Pressable onPress={() => props.onOpen(false)}>{props.action}</Pressable>
        </ContentSheetView>
      </BottomSheetView>
    </Sheet>
  );
}
