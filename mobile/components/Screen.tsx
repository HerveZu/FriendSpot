// import { BlurView } from '@react-native-community/blur';
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
import { Animated, KeyboardAvoidingView, useAnimatedValue, View, ViewProps } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { UserWallet } from '~/components/UserWallet';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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
  const { colors, isDarkColorScheme } = useColorScheme();

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
        {/* <BlurView
          blurType={isDarkColorScheme ? 'chromeMaterialDark' : 'chromeMaterialLight'}
          blurAmount={5}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        /> */}
        <Text variant="heading" className="mx-auto mb-4 mt-auto text-xl">
          {headerText}
        </Text>
      </Animated.View>

      <>
        <LinearGradient
          colors={[colors.primary, 'darkblue']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: '40%', width: '100%', position: 'absolute', opacity: 0.9 }}
        />
        <LinearGradient
          colors={['transparent', colors.background]}
          locations={[0, 0.35]}
          style={{ height: '100%', width: '100%', position: 'absolute' }}
        />
      </>

      <KeyboardAvoidingView behavior={'padding'} className={'h-full'}>
        <KeyboardAwareScrollView
          className={cn(props.stickyBottom && 'mb-4')}
          enableOnAndroid={true}
          viewIsInsideTabBar={true}
          extraHeight={100} // workaround to make the scroll to focused multiline input work
          scrollIndicatorInsets={{ right: 3 }}
          onScroll={(e) => setScroll(e.nativeEvent.contentOffset.y)}>
          <Screen className={cn('pt-safe-offset-10')}>
            <View className={cn('flex-col gap-8', props.className)}>{props.children}</View>
          </Screen>
        </KeyboardAwareScrollView>
        {props.stickyBottom && (
          <View className={'absolute bottom-0 left-0 right-0 bg-background p-6 pt-0'}>
            {props.stickyBottom}
          </View>
        )}
      </KeyboardAvoidingView>
    </HeaderContext.Provider>
  );
}

export function Screen({ className, ...props }: ViewProps) {
  return <View className={cn('mx-auto h-full w-full p-6', className)} {...props} />;
}

export function ScreenTitle({
  title,
  wallet = true,
  className,
  style,
  ...props
}: { title: string; wallet?: boolean } & ViewProps) {
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
    setHeaderText(title);
  }, [title]);

  return (
    <Animated.View
      className={cn('mb-6 flex-col gap-4', className)}
      style={[
        {
          opacity: fadeOpacity,
        },
        style,
      ]}
      {...props}>
      <Text variant="title1" className="text-3xl font-extrabold">
        {headerText}
      </Text>
      {wallet && <UserWallet />}
    </Animated.View>
  );
}
