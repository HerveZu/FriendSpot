import React, { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Card } from './Card';
import { Button } from '~/components/nativewindui/Button';

const TabsSelectorContext = createContext<{
  disabled: boolean;
  selectedTab: number;
  setSelectedTab: (index: number) => void;
}>(null!);

export function TabsProvider(
  props: PropsWithChildren<{ defaultTabIndex: number; disabled?: boolean }>
) {
  const [selectedTab, setSelectedTab] = useState(props.defaultTabIndex);

  return (
    <TabsSelectorContext.Provider
      value={{ selectedTab, setSelectedTab, disabled: !!props.disabled }}>
      {props.children}
    </TabsSelectorContext.Provider>
  );
}

export function TabArea(
  props: PropsWithChildren<{ tabIndex: number; displayOnDisable?: boolean }>
) {
  const { selectedTab, disabled } = useContext(TabsSelectorContext);

  const isFocused = !disabled && selectedTab === props.tabIndex;
  const displayAsDisable = disabled && props.displayOnDisable;

  return displayAsDisable || isFocused ? props.children : null;
}

export function TabsSelector(props: PropsWithChildren) {
  const { disabled } = useContext(TabsSelectorContext);
  return !disabled && <Card className={'flex-row gap-1 p-1'}>{props.children}</Card>;
}

export function Tab(props: PropsWithChildren<{ index: number; disabled?: boolean }>) {
  const { selectedTab, setSelectedTab } = useContext(TabsSelectorContext);

  const isFocused = selectedTab === props.index;

  return (
    <Button
      disabled={props.disabled}
      variant={isFocused ? 'tonal' : 'plain'}
      className={'grow'}
      onPress={() => setSelectedTab(props.index)}>
      {props.children}
    </Button>
  );
}
