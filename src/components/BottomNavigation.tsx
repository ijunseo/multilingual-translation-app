import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "translate", label: "Translate", icon: "🌐" },
  { id: "history", label: "History", icon: "📋" },
  { id: "flashcard", label: "Study", icon: "📚" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab
          ]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text style={[
            styles.tabIcon,
            activeTab === tab.id && styles.activeTabIcon
          ]}>
            {tab.icon}
          </Text>
          <Text style={[
            styles.tabLabel,
            activeTab === tab.id && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    paddingBottom: 32,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  activeTab: {
    // Add active styling if needed
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTabIcon: {
    // Add active icon styling if needed
  },
  tabLabel: {
    fontSize: 12,
    color: "#666666",
  },
  activeTabLabel: {
    color: "#030213",
    fontWeight: "500",
  },
});