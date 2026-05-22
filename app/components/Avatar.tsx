import React from "react";
import { Avatar as PaperAvatar } from "react-native-paper";

// Usage: <Avatar icon="wallet" />, <Avatar source={...} />, <Avatar label="AB" />
export default function Avatar(props: any) {
  if (props.icon) {
    return <PaperAvatar.Icon {...props} />;
  }
  if (props.source) {
    return <PaperAvatar.Image {...props} />;
  }
  if (props.label) {
    return <PaperAvatar.Text {...props} />;
  }
  // fallback
  return null;
}

