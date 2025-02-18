import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  useAnimatedValue,
  View,
  ViewProps,
} from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { UserWallet } from '~/components/UserWallet';

const HeaderContext = createContext<{
  hideHeader: boolean;
  headerText: string | undefined;
  setHeaderText: Dispatch<SetStateAction<string | undefined>>;
}>(null!);

const HIDE_HEADER_AFTER_SCROLL = 20;

export function ScreenWithHeader(
  props: { className?: string; stickyBottom?: ReactNode } & PropsWithChildren
) {
  const [headerText, setHeaderText] = useState<string>();
  const [scroll, setScroll] = useState(0);
  const { isDarkColorScheme } = useColorScheme();

  const hideHeader = scroll <= HIDE_HEADER_AFTER_SCROLL;
  const fadeOpacity = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(fadeOpacity, {
      toValue: hideHeader ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [hideHeader]);

  return (
    <HeaderContext.Provider value={{ hideHeader, headerText, setHeaderText }}>
      <Animated.View
        className={cn(
          'pt-safe-offset-0 absolute left-0 right-0 top-0 z-50 h-32 bg-transparent backdrop-blur-3xl'
        )}
        style={{
          opacity: fadeOpacity,
        }}>
        <BlurView
          blurType={isDarkColorScheme ? 'chromeMaterialDark' : 'chromeMaterialLight'}
          blurAmount={5}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
        <Text variant="heading" className="mx-auto mb-4 mt-auto text-xl">
          {headerText}
        </Text>
      </Animated.View>

      <Screen className={cn('pt-safe-offset-0 gap-6')}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={(e) => setScroll(e.nativeEvent.contentOffset.y)}>
          <View className={props.className}>{props.children}</View>
        </ScrollView>
        {props.stickyBottom}
      </Screen>
    </HeaderContext.Provider>
  );
}

export function Screen({ className, ...props }: ViewProps) {
  const { colors } = useColorScheme();

  return (
    <>
      <LinearGradient
        colors={[colors.primary, colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: '40%', width: '100%', position: 'absolute', opacity: 0.6 }}
      />
      <LinearGradient
        colors={['transparent', colors.background]}
        locations={[0, 0.45]}
        style={{ height: '100%', width: '100%', position: 'absolute' }}
      />
      <SafeAreaView>
        <View className={cn('mx-auto h-full w-full p-6 pt-0', className)} {...props} />
      </SafeAreaView>
    </>
  );
}

export function ScreenTitle(props: { title: string }) {
  const { hideHeader, headerText, setHeaderText } = useContext(HeaderContext);
  const fadeOpacity = useAnimatedValue(1);

  useEffect(() => {
    Animated.timing(fadeOpacity, {
      toValue: hideHeader ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [hideHeader]);

  useEffect(() => {
    setHeaderText(props.title);
  }, [props.title]);

  return (
    <Animated.View
      className="flex-col gap-4 "
      style={{
        opacity: fadeOpacity,
      }}>
      <Text variant="title1" className="text-3xl font-extrabold">
        {headerText}
      </Text>
      <UserWallet />
    </Animated.View>
  );
}
