import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from "react-native";

interface MobileTranslationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onSpeak?: (text: string, language?: string) => void;
  onVoiceInput?: () => void;
  maxLength?: number;
  isLoading?: boolean;
  isListening?: boolean;
}

export function MobileTranslationInput({
  value,
  onChange,
  placeholder,
  onSpeak,
  onVoiceInput,
  maxLength = 5000,
  isLoading = false,
  isListening = false,
}: MobileTranslationInputProps) {
  const handleClear = () => {
    onChange("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          style={styles.textInput}
          multiline={true}
          maxLength={maxLength}
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => {
            Keyboard.dismiss();
          }}
        />

        <View style={styles.actionBar}>
          <Text style={styles.characterCount}>
            {value.length} / {maxLength}
          </Text>

          <View style={styles.buttonContainer}>
            {value.length > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleClear}
              >
                <Text style={styles.buttonText}>×</Text>
              </TouchableOpacity>
            )}

            {onVoiceInput && (
              <TouchableOpacity
                style={[styles.actionButton, isListening && styles.listeningButton]}
                onPress={onVoiceInput}
              >
                <Text style={styles.buttonText}>
                  {isListening ? '⏹' : '🎤'}
                </Text>
              </TouchableOpacity>
            )}

            {value.length > 0 && onSpeak && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onSpeak && onSpeak(value)}
              >
                <Text style={styles.buttonText}>🔊</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  inputContainer: {
    position: "relative",
  },
  textInput: {
    minHeight: 100,
    maxHeight: 120,
    fontSize: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    textAlignVertical: "top",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: "#666666",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    backgroundColor: "transparent",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  listeningButton: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.3)",
  },
  buttonText: {
    fontSize: 20,
  },
});