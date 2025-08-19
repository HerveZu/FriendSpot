import { Button } from '~/components/nativewindui/Button';
import { ReactNode } from 'react';
import { ExpandItem, ExpandRow } from '~/components/ExpandItem';

export function ButtonSelect<TOption>(props: {
  selectedOption: TOption | null;
  setSelectedOption: (option: TOption | null) => void;
  options: { key: TOption; label: (selected: boolean) => ReactNode }[];
}) {
  return (
    <ExpandRow className={'flex-row justify-between gap-2'}>
      {props.options.map((option, i) => {
        const isSelected = props.selectedOption === option.key;
        return (
          <ExpandItem key={i}>
            <Button
              variant={isSelected ? 'primary' : 'tonal'}
              onPress={() =>
                isSelected ? props.setSelectedOption(null) : props.setSelectedOption(option.key)
              }>
              {option.label(isSelected)}
            </Button>
          </ExpandItem>
        );
      })}
    </ExpandRow>
  );
}
