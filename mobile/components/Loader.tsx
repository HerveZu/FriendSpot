import { ActivityIndicator, SafeAreaView } from 'react-native';

export function Loader() {
  return (
    <SafeAreaView className="h-full flex-col justify-center">
      <ActivityIndicator />
    </SafeAreaView>
  );
}
