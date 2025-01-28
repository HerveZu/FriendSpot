import React from 'react';
import { SafeAreaView, View, Image } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';
import ContentView from '~/components/ContentView';
import { Text } from '~/components/nativewindui/Text';
import avatar from '../../assets/avatar.png';
import { Rating } from '~/components/Rating';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth } from '~/authentication/firebase';

export default function UserProfileScreen() {
  const { userProfile } = useCurrentUser();

  const { colors } = useColorScheme();

  const [user] = useAuthState(firebaseAuth);

  return (
    <SafeAreaView>
      <ContentView className=" border-2 border-red-500">
        <View className="flex-row items-center justify-around gap-5 border-2 border-green-500">
          <View>
            {userProfile.pictureUrl ? (
              <Image source={{ uri: userProfile.pictureUrl }} style={{ width: 100, height: 100 }} />
            ) : (
              <Image source={avatar} style={{ width: 100, height: 100 }} />
            )}
          </View>
          <View className="gap-4">
            <Text variant={'largeTitle'} className={`rounded-lg border bg-primary px-2`}>
              {userProfile.displayName}
            </Text>
            <Rating className="" rating={userProfile.rating} stars={3} color={colors.primary} />
          </View>
        </View>
        <View className="mt-10 gap-2">
          <Text variant={'title2'}>Email</Text>
          <View>
            <Button className="h-12 justify-start" variant={'primary'}>
              <FontAwesome name="envelope" size={20} color={colors.foreground} />
              <Text>{user?.email}</Text>
            </Button>
          </View>
        </View>
        <View className="mt-10 flex-row items-center justify-center">
          <View className="h-px flex-1 bg-primary" />
          <Text className="mx-4">Mon spot</Text>
          <View className="h-px flex-1 bg-primary" />
        </View>
        <Button className="mt-5 h-auto flex-col items-start justify-start">
          <Text>
            {userProfile.spot ? userProfile.spot.parking.name : 'Aucun nom de parking de défini'}
          </Text>
          <View className="flex-row items-center gap-2">
            <FontAwesome name="map-marker" size={26} color={colors.foreground} />
            <Text className="text-md">
              {userProfile.spot?.parking
                ? userProfile.spot?.parking?.address
                : 'Aucune adresse parking définie'}
            </Text>
          </View>
        </Button>
        <View className="mt-6 flex-row justify-around">
          <View className="h-52 w-36 border-2 border-dashed border-primary">Bordure</View>
          <View className="mt-5 flex">
            <Text className="text-xl">Place n°</Text>
            <Button className="h-auto">
              <Text className="text-white">{userProfile.spot ? userProfile.spot.name : 'A43'}</Text>
            </Button>
          </View>
        </View>
      </ContentView>
    </SafeAreaView>
  );
}
