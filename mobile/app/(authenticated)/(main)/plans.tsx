import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import { Animated } from 'react-native';
import { Card } from '~/components/Card';
import { Text } from '~/components/nativewindui/Text';
import { Button } from '~/components/nativewindui/Button';
import { useTranslation } from 'react-i18next';
import { ThemedIcon } from '~/components/ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';
import { ReactElement } from 'react';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tag } from '~/components/Tag';
import View = Animated.View;

type Plan = {
  icon: ReactElement;
  name: string;
  price: string;
  period: string;
  upgradeButton: string;
  description: string;
  features: string[];
};

export default function Plans() {
  const { t } = useTranslation();

  function getPlan(
    name: string,
    price: number,
    periodType: 'monthly' | 'perUserMonthly',
    icon: ReactElement
  ): Plan {
    return {
      name: t(`upgrade.plans.${name}.name`),
      price: `€${price}`,
      period: t(`upgrade.plans.periods.${periodType}`),
      description: t(`upgrade.plans.${name}.description`),
      features: t(`upgrade.plans.${name}.features`).split(';'),
      upgradeButton: t(`upgrade.plans.${name}.upgradeButton`),
      icon: icon,
    };
  }

  const plans: Plan[] = [
    getPlan(
      'premium',
      2,
      'monthly',
      <ThemedIcon name={'crown'} component={MaterialCommunityIcons} size={24} />
    ),
    getPlan(
      'neighbourhood',
      5,
      'perUserMonthly',
      <ThemedIcon name={'groups'} component={MaterialIcons} size={24} />
    ),
  ];

  return (
    <ScreenWithHeader>
      <ScreenTitle title={t('upgrade.title')} wallet={false}>
        <Tag text={'Coming soon'}></Tag>
      </ScreenTitle>
      <View className={'flex-col gap-6'}>
        {plans.map((plan, i) => (
          <PlanCard key={i} plan={plan} />
        ))}
      </View>
    </ScreenWithHeader>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const { colors } = useColorScheme();
  return (
    <Card>
      <View className={'flex-row items-center justify-between'}>
        <View className={'flex-row items-center gap-1'}>
          {plan.icon}
          <Text variant={'heading'}>{plan.name}</Text>
        </View>

        <View className={'flex-row items-center gap-1'}>
          <Text className={'text-xl font-bold text-primary'}>{plan.price}</Text>
          <Text>{plan.period}</Text>
        </View>
      </View>
      <Text>{plan.description}</Text>
      <View className={'flex-col gap-2'}>
        {plan.features.map((feature, i) => (
          <View key={i} className={'flex-row items-center gap-2'}>
            <ThemedIcon name={'check'} size={20} color={colors.primary} />
            <Text className={'font-semibold text-primary'}>{feature}</Text>
          </View>
        ))}
      </View>
      <Button variant={'primary'} disabled>
        <ThemedIcon name={'lock'} />
        <Text>{plan.upgradeButton}</Text>
      </Button>
    </Card>
  );
}
