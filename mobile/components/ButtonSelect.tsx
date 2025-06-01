import { View } from 'react-native';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';

export function ButtonSelect<TOption>(props: {
  selectedOption: TOption | null;
  setSelectedOption: (option: TOption | null) => void;
  options: { key: TOption; label: string }[];
}) {
  return (
    <View className={'flex-row justify-between gap-2'}>
      {props.options.map((option, i) => {
        const isSelected = props.selectedOption === option.key;
        return (
          <Button
            key={i}
            variant={isSelected ? 'primary' : 'tonal'}
            className={'grow'}
            onPress={() =>
              isSelected ? props.setSelectedOption(null) : props.setSelectedOption(option.key)
            }>
            <Text>{option.label}</Text>
          </Button>
        );
      })}
    </View>
  );
}
