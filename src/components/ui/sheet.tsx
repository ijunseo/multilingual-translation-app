import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface SheetTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface SheetContentProps {
  side?: "bottom" | "top";
  className?: string;
  children: React.ReactNode;
}

interface SheetHeaderProps {
  children: React.ReactNode;
}

interface SheetTitleProps {
  children: React.ReactNode;
}

interface SheetDescriptionProps {
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  return <>{children}</>;
};

export const SheetTrigger: React.FC<SheetTriggerProps> = ({ children }) => {
  return <>{children}</>;
};

export const SheetContent: React.FC<SheetContentProps> = ({
  side = "bottom",
  children,
}) => {
  return (
    <View style={styles.contentContainer}>
      <ScrollView style={styles.scrollView}>
        {children}
      </ScrollView>
    </View>
  );
};

export const SheetHeader: React.FC<SheetHeaderProps> = ({ children }) => {
  return <View style={styles.header}>{children}</View>;
};

export const SheetTitle: React.FC<SheetTitleProps> = ({ children }) => {
  return <Text style={styles.title}>{children}</Text>;
};

export const SheetDescription: React.FC<SheetDescriptionProps> = ({
  children,
}) => {
  return <Text style={styles.description}>{children}</Text>;
};

const styles = StyleSheet.create({
  contentContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: screenHeight * 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
});