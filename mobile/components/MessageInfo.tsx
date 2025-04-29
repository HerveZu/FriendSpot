import { Pressable, Text, View } from 'react-native';
import { ThemedIcon } from './ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';
import { Card } from '~/components/Card';

export function MessageInfo(props: { info: string; action?: () => void }) {
  const { colors } = useColorScheme();
  return (
    <>
      {props.action ? (
        <Pressable onPress={() => props.action && props.action()}>
          <Card className="bg-primary/20 flex-row items-center justify-center">
            <ThemedIcon name="lightbulb-o" size={24} color={colors.primary} />
            <Text className="shrink text-lg font-semibold text-foreground">{props.info}</Text>
          </Card>
        </Pressable>
      ) : (
        <View className="w-full flex-row items-center gap-4">
          <ThemedIcon name="lightbulb-o" size={24} color={colors.primary} />
          <Text className="shrink text-lg font-semibold text-foreground">{props.info}</Text>
        </View>
      )}
    </>
  );
}
