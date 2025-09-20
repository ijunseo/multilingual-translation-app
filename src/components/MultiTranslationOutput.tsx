import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface MultiTranslationOutputProps {
  sourceText: string;
  sourceLanguage: Language;
  translations: Record<string, string>;
  targetLanguages: Language[];
  isLoading: boolean;
  onSpeak: (text: string, language: string) => void;
  onSave?: () => void;
  canSave?: boolean;
}

export function MultiTranslationOutput({
  sourceText,
  sourceLanguage,
  translations,
  targetLanguages,
  isLoading,
  onSpeak,
  onSave,
  canSave = true,
}: MultiTranslationOutputProps) {
  if (!sourceText.trim()) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🌐</Text>
          <Text style={styles.emptyTitle}>Enter text to translate</Text>
          <Text style={styles.emptySubtext}>
            Type or speak text in {sourceLanguage.nativeName} to see translations
          </Text>
        </View>
      </View>
    );
  }

  if (targetLanguages.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🌐</Text>
          <Text style={styles.emptyTitle}>No target languages enabled</Text>
          <Text style={styles.emptySubtext}>
            Please enable at least one target language in Settings
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        bounces={true}
        nestedScrollEnabled={true}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="always"
        scrollEventThrottle={16}
        directionalLockEnabled={false}
      >
      {targetLanguages.map((language) => {
        const translation = translations[language.code] || "";

        return (
          <View key={language.code} style={styles.translationCard}>
            <View style={styles.languageHeader}>
              <Text style={styles.languageName}>{language.nativeName}</Text>
              <Text style={styles.languageSubtext}>{language.name}</Text>
            </View>

            <View style={styles.translationContent}>
              {isLoading ? (
                <Text style={styles.loadingText}>Translating...</Text>
              ) : (
                <Text style={styles.translationText}>{translation}</Text>
              )}

              {translation && !isLoading && (
                <TouchableOpacity
                  style={styles.speakButton}
                  onPress={() => onSpeak(translation, language.code)}
                >
                  <Text style={styles.speakButtonText}>🔊</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {/* Save Button */}
      {sourceText.trim() && Object.keys(translations).length > 0 && !isLoading && onSave && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={!canSave}
          >
            <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
              ❤️ Save to Phrasebook
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    height: '100%',
  },
  container: {
    flex: 1,
    height: '100%',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  translationCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    overflow: "visible",
  },
  languageHeader: {
    marginBottom: 8,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  languageSubtext: {
    fontSize: 14,
    color: "#666666",
  },
  translationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  translationText: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    lineHeight: 24,
  },
  loadingText: {
    flex: 1,
    fontSize: 16,
    color: "#666666",
    fontStyle: "italic",
  },
  speakButton: {
    marginLeft: 12,
    padding: 8,
  },
  speakButtonText: {
    fontSize: 20,
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: "#ffffff",
  },
  saveButton: {
    backgroundColor: "#030213",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#f3f3f5",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButtonTextDisabled: {
    color: "#666666",
  },
});