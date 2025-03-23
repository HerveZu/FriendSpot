import { Text, View } from 'react-native';
import { Button } from './nativewindui/Button';
import { ThemedIcon } from './ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';

export function MessageInfo(props: { info: string; action?: () => void }) {
  const { colors } = useColorScheme();
  return (
    <>
      {props.action ? (
        <Button
          className="mx-auto w-full flex-row items-center justify-center gap-4"
          variant="tonal"
          onPress={() => props.action && props.action()}>
          <ThemedIcon name="lightbulb-o" size={24} color={colors.primary} />
          <Text className="shrink text-lg font-semibold text-foreground">{props.info}</Text>
        </Button>
      ) : (
        <View className="w-full flex-row items-center gap-4">
          <ThemedIcon name="lightbulb-o" size={24} color={colors.primary} />
          <Text className="shrink text-lg font-semibold text-foreground">{props.info}</Text>
        </View>
      )}
    </>
  );
}
