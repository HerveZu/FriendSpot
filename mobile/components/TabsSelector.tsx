import React, { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Card } from './Card';
import { Button } from '~/components/nativewindui/Button';

const TabsSelectorContext = createContext<{
  selectedTab: number;
  setSelectedTab: (index: number) => void;
}>(null!);

export function TabsProvider(props: PropsWithChildren<{ defaultTabIndex: number }>) {
  const [selectedTab, setSelectedTab] = useState(props.defaultTabIndex);

  return (
    <TabsSelectorContext.Provider value={{ selectedTab, setSelectedTab }}>
      {props.children}
    </TabsSelectorContext.Provider>
  );
}

export function TabArea(props: PropsWithChildren<{ tabIndex: number }>) {
  const { selectedTab } = useContext(TabsSelectorContext);

  return props.tabIndex === selectedTab ? props.children : null;
}

export function TabsSelector(props: PropsWithChildren) {
  return <Card className={'flex-row gap-0 p-0'}>{props.children}</Card>;
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
