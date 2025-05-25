import React, { createContext, PropsWithChildren, useContext } from 'react';
import { Card } from './Card';
import { Text } from '~/components/nativewindui/Text';
import { Button } from '~/components/nativewindui/Button';

const TabsSelectorContext = createContext<{
  selectedTab: number;
  setSelectedTab: (index: number) => void;
}>(null!);

export function TabsProvider(
  props: PropsWithChildren<{ selectedTab: number; onTabSelected: (index: number) => void }>
) {
  return (
    <TabsSelectorContext.Provider
      value={{ selectedTab: props.selectedTab, setSelectedTab: props.onTabSelected }}>
      {props.children}
    </TabsSelectorContext.Provider>
  );
}

export function TabArea(props: PropsWithChildren<{ tabIndex: number }>) {
  const { selectedTab } = useContext(TabsSelectorContext);

  return props.tabIndex === selectedTab ? props.children : null;
}

export function TabsSelector(props: PropsWithChildren) {
  return <Card className={'flex-row gap-2 p-2'}>{props.children}</Card>;
}

export function Tab(props: { index: number; title: string; disabled?: boolean }) {
  const { selectedTab, setSelectedTab } = useContext(TabsSelectorContext);

  return (
    <Button
      disabled={props.disabled}
      variant={selectedTab === props.index ? 'tonal' : 'plain'}
      className={'grow'}
      onPress={() => setSelectedTab(props.index)}>
      <Text>{props.title}</Text>
    </Button>
  );
}
