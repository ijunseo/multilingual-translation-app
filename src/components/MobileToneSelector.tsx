import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

interface TranslationTone {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface MobileToneSelectorProps {
  tones: TranslationTone[];
  selectedTone: string;
  onToneChange: (tone: string) => void;
}

export function MobileToneSelector({
  tones,
  selectedTone,
  onToneChange,
}: MobileToneSelectorProps) {
  const selectedToneObj = tones.find(t => t.id === selectedTone);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Translation Style</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toneList}>
        {tones.map((tone) => (
          <TouchableOpacity
            key={tone.id}
            style={[
              styles.toneButton,
              selectedTone === tone.id && styles.selectedTone
            ]}
            onPress={() => onToneChange(tone.id)}
          >
            <Text style={[
              styles.toneName,
              selectedTone === tone.id && styles.selectedToneName
            ]}>
              {tone.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedToneObj && (
        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            {selectedToneObj.description}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  toneList: {
    flexDirection: "row",
    marginBottom: 6,
  },
  toneButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    minWidth: 80,
    alignItems: "center",
  },
  selectedTone: {
    backgroundColor: "#030213",
    borderColor: "#030213",
  },
  toneName: {
    fontSize: 12,
    color: "#030213",
    fontWeight: "500",
  },
  selectedToneName: {
    color: "#ffffff",
  },
  description: {
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 12,
    color: "#666666",
  },
});