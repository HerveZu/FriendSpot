import { View, Text } from "react-native";
import { ThemedIcon } from "./ThemedIcon";
import { useColorScheme } from '~/lib/useColorScheme';

export function MessageInfo(props: { info: string}) {
    const { colors } = useColorScheme();
    return (
        <View className="flex-row mx-auto items-center w-full gap-4" >
            <ThemedIcon name="lightbulb-o" size={22} color={colors.primary} />
            <Text className="shrink text-foreground text-base font-semibold">{props.info}</Text>
        </View>
    );
}