import { Text } from '~/components/nativewindui/Text';
import { SafeAreaView, View, ViewProps } from 'react-native';
import { cn } from '~/lib/cn';
import ReactModal from 'react-native-modal';
import { Dispatch, ReactNode, SetStateAction } from 'react';

export function Modal({
  open,
  onOpenChange,
  className,
  children,
  ...props
}: { open: boolean; onOpenChange: Dispatch<SetStateAction<boolean>> } & ViewProps) {
  return (
    // this extra View makes it display properly on Android devices
    <View>
      <ReactModal
        isVisible={open}
        onBackdropPress={() => onOpenChange(false)}
        // this removes the flickering on exit
        backdropTransitionOutTiming={1}>
        <SafeAreaView>
          <View className={'bg-background'} {...props}>
            <View className={cn('bg-primary/15 w-full flex-col gap-2 rounded-xl p-4', className)}>
              {children}
            </View>
          </View>
        </SafeAreaView>
      </ReactModal>
    </View>
  );
}

export function ModalTitle(props: { text: string; icon?: ReactNode; className?: string }) {
  return (
    <View className={cn('flex-row items-center gap-4', props.className)}>
      {props.icon}
      <Text variant="title1" className={cn('font-semibold', props.className)}>
        {props.text}
      </Text>
    </View>
  );
}

export function ModalFooter(props: { text: string; className?: string }) {
  return (
    <View className={cn('flex-row items-center justify-center', props.className)}>
      <Text variant="footnote" className={cn('w-full text-center italic')}>
        {props.text}
      </Text>
    </View>
  );
}
