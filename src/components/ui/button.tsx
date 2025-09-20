import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = "default",
  size = "default",
  disabled = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    disabled && styles.disabledButton,
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <Text style={buttonTextStyle}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },

  // Variants
  defaultButton: {
    backgroundColor: "#030213",
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 36,
  },
  defaultText: {
    color: "#ffffff",
    fontSize: 14,
  },
  destructiveButton: {
    backgroundColor: "#d4183d",
  },
  destructiveText: {
    color: "#ffffff",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  outlineText: {
    color: "#030213",
  },
  secondaryButton: {
    backgroundColor: "#f3f3f5",
  },
  secondaryText: {
    color: "#030213",
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  ghostText: {
    color: "#030213",
  },
  linkButton: {
    backgroundColor: "transparent",
  },
  linkText: {
    color: "#030213",
    textDecorationLine: "underline",
  },

  // Size text styles
  smText: {
    fontSize: 12,
  },
  lgText: {
    fontSize: 16,
  },
  iconText: {
    fontSize: 14,
  },

  // Size button styles
  smButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 32,
  },
  lgButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    height: 40,
  },
  iconButton: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
  },

  // Disabled state
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});