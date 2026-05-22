import React from "react";
import { Modal as PaperModal, Portal } from "react-native-paper";

export default function Modal(props: any) {
  return (
    <Portal>
      <PaperModal {...props} />
    </Portal>
  );
}

