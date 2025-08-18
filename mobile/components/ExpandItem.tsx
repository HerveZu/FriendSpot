import { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function ExpandItem(props: PropsWithChildren) {
  return <View className="flex-1">{props.children}</View>;
}

export function ExpandRow(props: PropsWithChildren) {
  return <View className="flex-row items-center gap-4">{props.children}</View>;
}
