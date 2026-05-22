import React from "react";
import { Text, TextProps } from "react-native";
import { FontFamily, Typography } from "../_lib/typography";

export default function Label(props: TextProps) {
  return <Text {...props} style={[
    { 
      fontFamily: FontFamily.primarySemiBold, 
      color: '#1A2947',
      ...Typography.caption.lg
    }, 
    props.style
  ]} />;
}

