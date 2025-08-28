import { ButtonProps, Button } from '~/components/nativewindui/Button';
import { Linking } from 'react-native';

export function ContactUsButton({
  onPress,
  contactUsDisabled,
  ...props
}: ButtonProps & { contactUsDisabled?: boolean }) {
  return (
    <Button
      onPress={async (e) => {
        onPress?.(e);
        !contactUsDisabled && (await Linking.openURL('mailto:support@friendspot.app'));
      }}
      {...props}
    />
  );
}
