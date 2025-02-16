// react-native-modal.d.ts
import React from 'react';
import type { ModalProps } from 'react-native-modal';

type PartialProps = Partial<ModalProps> & {
  children: ModalProps['children'];
};

declare module 'react-native-modal' {
  const Modal: (Props: PartialProps) => React.ReactNode;
  export default Modal;
}
