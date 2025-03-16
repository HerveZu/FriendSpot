import { Text } from "react-native";
import { Button } from "./nativewindui/Button";
import { ThemedIcon } from "./ThemedIcon";
import { useColorScheme } from '~/lib/useColorScheme';

import { View } from "react-native";

export function MessageInfo(props: { info: string, action?: () => void }) {
    const { colors } = useColorScheme();
    return (
        <>
            {props.action ? (
                <Button className="flex-row mx-auto justify-center items-center w-full gap-4" variant="tonal" onPress={() => props.action && props.action()}>
                    <ThemedIcon name="lightbulb-o" size={22} color={colors.primary} />
                    <Text className="shrink text-foreground text-base font-semibold">{props.info}</Text>
                </Button>
            ) : (
                <View className="flex-row items-center w-full gap-4">
                    <ThemedIcon name="lightbulb-o" size={22} color={colors.primary} />
                    <Text className="shrink text-foreground text-base font-semibold">{props.info}</Text>
                </View>
            )}
        </>
    );
}