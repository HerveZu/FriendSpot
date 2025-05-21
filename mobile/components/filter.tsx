import { View, Text } from 'react-native';
import React, { Dispatch, SetStateAction } from 'react';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import BlinkingDot from './BlinkingDot';

export function Filter(props: {
    filterOne: string;
    filterTwo: string;
    filterChoice: string;
    filterTextOne: string;
    filterTextTwo: string;
    liveSpotCount?: number;
    setFilterChoice: Dispatch<SetStateAction<string>>;

}) {
    const { colors } = useColorScheme();

    const changeChoiceFilter = (choice: string) => {
        props.setFilterChoice(choice);
      }
      
    return( 
    <View className='rounded-lg flex-row w-full justify-start gap-2'>
        <Button className='w-50' size={"lg"} variant={`${props.filterChoice === props.filterOne ? "primary" : "secondary"}`} onPress={() => changeChoiceFilter(props.filterOne)}>
          <Text style={{ color: colors.foreground }} className="text-md">{props.filterTextOne}</Text>
        </Button>
        <Button className='w-50' size={"lg"} variant={`${props.filterChoice === props.filterTwo ? "primary" : "secondary"}`} onPress={() => changeChoiceFilter(props.filterTwo)}>
          <BlinkingDot className={'left-[-5]'} color={colors.destructive} />
          <Text style={{ color: colors.foreground }} className={`text-md`}>{`${props.filterTextTwo} ${props.liveSpotCount ? `(` + props.liveSpotCount + `)` : ''}`}</Text>
        </Button>
      </View>
    )


}