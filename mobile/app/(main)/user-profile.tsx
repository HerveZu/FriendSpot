import { useCurrentUser } from '~/authentication/UserProvider';
import ContentView from '~/components/ContentView';
import { Text } from '~/components/nativewindui/Text';
import avatar from '../../assets/avatar.png';
import { Rating } from '~/components/Rating';
import { useColorScheme } from '~/lib/useColorScheme';
import { Button } from '~/components/nativewindui/Button';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth } from '~/authentication/firebase';
import { ThemedIcon } from '~/components/ThemedIcon';
import { TextInput } from '~/components/TextInput';
import { SafeAreaView, View, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { getAuth, updateEmail, verifyBeforeUpdateEmail } from 'firebase/auth';
import validator from 'validator';

export default function UserProfileScreen() {
  const { userProfile } = useCurrentUser();
  const [user] = useAuthState(firebaseAuth);
  const { colors } = useColorScheme();

  const [oldEmail, setOldEmail] = useState<string>('');
  const [currentEmail, setCurrentEmail] = useState<string>('');

  const auth = getAuth();

  // Not working because before changing mail, you need re-login user and verify email
  const verifyEmail = async (text: string) => {
    if (validator.isEmail(text)) {
      if (auth.currentUser) {
        await verifyBeforeUpdateEmail(auth.currentUser, text).then(() => {
          if (auth.currentUser) {
            updateEmail(auth.currentUser, text);
          } else {
            return;
          }
        });
      }
    } else {
      setCurrentEmail(oldEmail);
      return;
    }
  };

  useEffect(() => {
    if (user) {
      setCurrentEmail(user.email ?? '');
    }
  }, [user]);

  return (
    <SafeAreaView>
      <ContentView className="border-2 border-red-500">
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
            <Rating rating={userProfile.rating} stars={3} color={colors.primary} />
          </View>
        </View>
        <View className="mt-10 gap-2">
          <Text variant={'title2'}>Email</Text>
          <View className="flex-row items-center">
            <TextInput
              className="flex w-full items-center bg-primary p-2"
              value={currentEmail}
              editable={true}
              onChangeText={(text) => setCurrentEmail(text)}
              onPressIn={() => {
                setOldEmail(currentEmail);
                setCurrentEmail('');
              }}
              onEndEditing={(event) => verifyEmail(event.nativeEvent.text)}
            />
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
          <Button className="flex-row items-center gap-2">
            <ThemedIcon name={'map-marker'} size={24} />
            <Text className="text-md">
              {userProfile.spot?.parking
                ? userProfile.spot?.parking?.address
                : 'Aucune adresse parking définie'}
            </Text>
          </Button>
        </Button>
        <View className="mt-6 flex-row justify-around">
          <View className="h-52 w-36 border-2 border-dashed border-primary"></View>
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
