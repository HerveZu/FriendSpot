import { Redirect } from 'expo-router';
import { useEffect } from 'react';

export default function NotFoundScreen() {
  useEffect(() => {
    console.log('Not found');
  }, []);

  return <Redirect href={'/'} />;
}
