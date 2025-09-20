import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Button } from "./ui/button";
import { TranslationDirection } from "./MobileSettings";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface MobileSourceLanguageSelectorProps {
  languages: Language[];
  sourceLanguage: Language;
  onSourceLanguageChange: (language: Language) => void;
  translationDirection?: TranslationDirection;
}

export function MobileSourceLanguageSelector({
  languages,
  sourceLanguage,
  onSourceLanguageChange,
  translationDirection = "all-to-all",
}: MobileSourceLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Debug log
  console.log('MobileSourceLanguageSelector - languages:', languages.length, languages);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Select source language</Text>
        </View>

        <TouchableOpacity
          style={styles.triggerButton}
          onPress={() => setIsOpen(true)}
        >
          <View>
            <Text style={styles.nativeNameText}>{sourceLanguage.nativeName}</Text>
            <Text style={styles.nameText}>{sourceLanguage.name}</Text>
          </View>
        </TouchableOpacity>

        <Modal
          visible={isOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select source language</Text>
                <Text style={styles.modalDescription}>
                  Choose the language you want to translate from
                </Text>
              </View>

              <View style={styles.languageListContainer}>
                <Text style={styles.debugText}>Languages count: {languages.length}</Text>
                {languages.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No languages available</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.languageList}>
                    {languages.map((language) => {
                      const isSelected = sourceLanguage.code === language.code;

                      return (
                        <TouchableOpacity
                          key={language.code}
                          style={[
                            styles.languageItem,
                            isSelected && styles.selectedLanguageItem
                          ]}
                          onPress={() => {
                            console.log('Language selected:', language);
                            onSourceLanguageChange(language);
                            setIsOpen(false);
                          }}
                        >
                          <View style={styles.languageContent}>
                            <Text style={[
                              styles.languageNativeName,
                              isSelected && styles.selectedText
                            ]}>
                              {language.nativeName}
                            </Text>
                            <Text style={[
                              styles.languageEnglishName,
                              isSelected && styles.selectedSubtext
                            ]}>
                              {language.name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={styles.footerText}>
          Auto-translate to other languages
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  content: {
    alignItems: "center",
  },
  headerContainer: {
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    color: "#666666",
  },
  triggerButton: {
    width: "100%",
    height: 48,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  nativeNameText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  nameText: {
    fontSize: 14,
    color: "#666666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: "60%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    marginBottom: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  languageList: {
    flex: 1,
    minHeight: 200,
  },
  languageItem: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  selectedLanguageItem: {
    backgroundColor: "#030213",
  },
  languageContent: {
    flex: 1,
  },
  languageNativeName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  languageEnglishName: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  selectedText: {
    color: "#ffffff",
  },
  selectedSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  closeButton: {
    backgroundColor: "#f3f3f5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#030213",
  },
  footerText: {
    fontSize: 12,
    color: "#666666",
    marginTop: 8,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  languageListContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#ff0000",
    textAlign: "center",
    marginBottom: 8,
  },
});