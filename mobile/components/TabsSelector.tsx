import React, { createContext, PropsWithChildren, ReactNode, useContext } from 'react';
import { Card } from './Card';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { ViewProps } from 'react-native';
import { cn } from '~/lib/cn';

const TabsSelectorContext = createContext<{
  disabled: boolean;
  selectedTab: string;
  setSelectedTab: (index: string) => void;
}>(null!);

export function TabsProvider(
  props: PropsWithChildren<{
    selectedTab: string;
    setSelectedTab: (tab: string) => void;
    disabled?: boolean;
  }>
) {
  return (
    <TabsSelectorContext.Provider
      value={{
        selectedTab: props.selectedTab,
        setSelectedTab: props.setSelectedTab,
        disabled: !!props.disabled,
      }}>
      {props.children}
    </TabsSelectorContext.Provider>
  );
}

export function TabArea(props: PropsWithChildren<{ tabIndex: string; isFallbackArea?: boolean }>) {
  const { selectedTab, disabled } = useContext(TabsSelectorContext);

  const isFocused = !disabled && selectedTab === props.tabIndex;
  const displayAsDisable = disabled && props.isFallbackArea;

  return displayAsDisable || isFocused ? props.children : null;
}

export function TabsSelector({ className, ...props }: ViewProps) {
  const { disabled } = useContext(TabsSelectorContext);
  return !disabled && <Card className={cn('flex-row gap-1 p-1', className)} {...props} />;
}

const TabContext = createContext<{
  isFocused: boolean;
}>(null!);

export function Tab(
  props: PropsWithChildren<{ index: string; disabled?: boolean; preview: ReactNode }>
) {
  const { selectedTab, setSelectedTab } = useContext(TabsSelectorContext);

  const isFocused = selectedTab === props.index;

  return (
    <TabContext.Provider value={{ isFocused }}>
      <Button
        disabled={props.disabled}
        variant={isFocused ? 'tonal' : 'plain'}
        className={'grow'}
        onPress={() => setSelectedTab(props.index)}>
        {props.preview}
        {isFocused && props.children}
      </Button>
    </TabContext.Provider>
  );
}

export function TabPreview(props: { icon: ReactNode; count: number | undefined | null }) {
  const { isFocused } = useContext(TabContext);

  return (
    <>
      {props.icon}
      {!isFocused && props.count !== null && <Text>{props.count ?? 0}</Text>}
    </>
  );
}
