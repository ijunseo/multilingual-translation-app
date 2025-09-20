import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";

interface MultiTranslationHistoryItem {
  id: string;
  sourceText: string;
  translations: Record<string, string>;
  sourceLanguage: string;
  timestamp: Date;
  category?: string;
  tone?: string;
}

interface PhrasebookCategory {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

interface MobileFlashCardProps {
  phrasebook: MultiTranslationHistoryItem[];
  history: MultiTranslationHistoryItem[];
  allLanguages: { code: string; name: string; nativeName: string }[];
  phrasebookCategories: PhrasebookCategory[];
  onSpeak: (text: string, language: string) => void;
}

interface SwipeResult {
  cardId: string;
  understood: boolean;
}

const { width: screenWidth } = Dimensions.get("window");

export function MobileFlashCard({
  phrasebook,
  history,
  allLanguages,
  phrasebookCategories,
  onSpeak,
}: MobileFlashCardProps) {
  const [activeTab, setActiveTab] = useState<"select" | "study" | "results">("select");
  const [selectedItems, setSelectedItems] = useState<MultiTranslationHistoryItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  // const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [swipeResults, setSwipeResults] = useState<SwipeResult[]>([]);

  const currentCard = selectedItems[currentCardIndex];
  const understoodCount = swipeResults.filter(r => r.understood).length;
  const notUnderstoodCount = swipeResults.filter(r => !r.understood).length;

  const getLanguageByCode = (code: string) => {
    return allLanguages.find(lang => lang.code === code);
  };

  const getCategoryById = (id: string) => {
    return phrasebookCategories.find(cat => cat.id === id);
  };

  const getPhrasebookByCategory = (categoryId: string) => {
    return phrasebook.filter(item => item.category === categoryId);
  };

  const getCategoryItemCount = (categoryId: string) => {
    return phrasebook.filter(item => item.category === categoryId).length;
  };

  const startFlashCardSession = (items: MultiTranslationHistoryItem[]) => {
    if (items.length === 0) {
      Alert.alert("Error", "No items selected for flash cards");
      return;
    }
    setSelectedItems(items);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSwipeResults([]);
    setActiveTab("study");
    Alert.alert("Success", `Starting flash card session with ${items.length} cards`);
  };

  const shuffleCards = () => {
    const shuffled = [...selectedItems].sort(() => Math.random() - 0.5);
    setSelectedItems(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSwipeResults([]);
    Alert.alert("Success", "Cards shuffled");
  };

  const nextCard = () => {
    if (currentCardIndex < selectedItems.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setActiveTab("results");
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const markAsUnderstood = () => {
    if (!currentCard) return;

    setSwipeResults(prev => [
      ...prev.filter(r => r.cardId !== currentCard.id),
      { cardId: currentCard.id, understood: true }
    ]);

    setTimeout(() => {
      nextCard();
    }, 300);
  };

  const markAsNotUnderstood = () => {
    if (!currentCard) return;

    setSwipeResults(prev => [
      ...prev.filter(r => r.cardId !== currentCard.id),
      { cardId: currentCard.id, understood: false }
    ]);

    setTimeout(() => {
      nextCard();
    }, 300);
  };

  const renderItemCard = (item: MultiTranslationHistoryItem, isFromPhrasebook: boolean = false) => {
    const sourceLang = getLanguageByCode(item.sourceLanguage);
    const category = item.category ? getCategoryById(item.category) : null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.itemCard}
        onPress={() => startFlashCardSession([item])}
      >
        <View style={styles.itemHeader}>
          <View style={styles.languageBadge}>
            <Text style={styles.languageBadgeText}>
              {sourceLang?.nativeName || item.sourceLanguage}
            </Text>
          </View>
          {isFromPhrasebook && (
            <Text style={styles.heartIcon}>❤️</Text>
          )}
          {item.tone && (
            <View style={styles.toneBadge}>
              <Text style={styles.toneBadgeText}>
                {item.tone.charAt(0).toUpperCase() + item.tone.slice(1)}
              </Text>
            </View>
          )}
          {isFromPhrasebook && category && (
            <View style={[styles.categoryBadge, { backgroundColor: `${category.color}20` }]}>
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                {category.name}
              </Text>
            </View>
          )}
          <Text style={styles.dateText}>
            {item.timestamp.toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.itemSourceText} numberOfLines={2}>
          {item.sourceText}
        </Text>

        <View style={styles.translationsPreview}>
          {Object.entries(item.translations).slice(0, 2).map(([langCode, translation]) => (
            <Text key={langCode} style={styles.translationPreviewText} numberOfLines={1}>
              {translation}
            </Text>
          ))}
          {Object.keys(item.translations).length > 2 && (
            <Text style={styles.moreTranslationsText}>
              +{Object.keys(item.translations).length - 2} more translations
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const SelectionScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Flash Cards</Text>
        <Text style={styles.headerSubtitle}>
          Choose items from your history or phrasebook to create flash cards
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick actions */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionButton, phrasebook.length === 0 && styles.quickActionButtonDisabled]}
            onPress={() => startFlashCardSession(phrasebook)}
            disabled={phrasebook.length === 0}
          >
            <Text style={styles.quickActionIcon}>❤️</Text>
            <Text style={styles.quickActionText}>All Phrasebook ({phrasebook.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, history.length === 0 && styles.quickActionButtonDisabled]}
            onPress={() => startFlashCardSession(history.slice(0, 10))}
            disabled={history.length === 0}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionText}>Recent History ({Math.min(history.length, 10)})</Text>
          </TouchableOpacity>
        </View>

        {/* Category quick actions */}
        {phrasebookCategories.length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Study by Category</Text>
            <View style={styles.categoryGrid}>
              {phrasebookCategories.map(category => {
                const itemCount = getCategoryItemCount(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryButton, itemCount === 0 && styles.categoryButtonDisabled]}
                    onPress={() => startFlashCardSession(getPhrasebookByCategory(category.id))}
                    disabled={itemCount === 0}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryButtonText} numberOfLines={1}>
                      {category.name} ({itemCount})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.separator} />

        {/* Individual selection tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Phrasebook ({phrasebook.length})</Text>
          </TouchableOpacity>
        </View>

        {phrasebook.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyTitle}>No saved phrases</Text>
            <Text style={styles.emptySubtitle}>
              Save some phrases to create flash cards
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {phrasebook.map((item) => renderItemCard(item, true))}
          </View>
        )}

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>History ({history.length})</Text>
          </TouchableOpacity>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No translation history</Text>
            <Text style={styles.emptySubtitle}>
              Start translating to see history
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {history.slice(0, 20).map((item) => renderItemCard(item))}
          </View>
        )}
      </ScrollView>
    </View>
  );

  const StudyScreen = () => {
    if (!currentCard) return null;

    const sourceLang = getLanguageByCode(currentCard.sourceLanguage);

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.studyHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveTab("select")}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {currentCardIndex + 1} / {selectedItems.length}
            </Text>
            <Text style={styles.progressSubtext}>Flash Cards</Text>
          </View>

          <View style={styles.studyActions}>
            <TouchableOpacity style={styles.actionButton} onPress={shuffleCards}>
              <Text style={styles.actionButtonText}>🔀</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Swipe instructions */}
        <View style={styles.swipeInstructions}>
          <Text style={styles.swipeInstructionText}>
            ← Don't know | Know it →
          </Text>
        </View>

        {/* Progress indicators */}
        <View style={styles.progressIndicators}>
          <View style={styles.progressIndicator}>
            <Text style={styles.progressIndicatorIcon}>✓</Text>
            <Text style={styles.progressIndicatorText}>{understoodCount}</Text>
          </View>
          <View style={styles.progressIndicator}>
            <Text style={styles.progressIndicatorIcon}>✗</Text>
            <Text style={styles.progressIndicatorText}>{notUnderstoodCount}</Text>
          </View>
        </View>

        {/* Flash Card */}
        <View style={styles.flashCardContainer}>
          <TouchableOpacity
            style={styles.flashCard}
            onPress={() => setIsFlipped(!isFlipped)}
            activeOpacity={0.9}
          >
            {!isFlipped ? (
              // Front side - Source text
              <View style={styles.flashCardContent}>
                <View style={styles.flashCardBadges}>
                  <View style={styles.languageBadge}>
                    <Text style={styles.languageBadgeText}>
                      {sourceLang?.nativeName || currentCard.sourceLanguage}
                    </Text>
                  </View>
                  {currentCard.tone && (
                    <View style={styles.toneBadge}>
                      <Text style={styles.toneBadgeText}>
                        {currentCard.tone.charAt(0).toUpperCase() + currentCard.tone.slice(1)} Style
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.flashCardText}>
                  {currentCard.sourceText}
                </Text>

                <TouchableOpacity
                  style={styles.speakButton}
                  onPress={() => onSpeak(currentCard.sourceText, currentCard.sourceLanguage)}
                >
                  <Text style={styles.speakButtonText}>🔊 Listen</Text>
                </TouchableOpacity>

                <Text style={styles.tapHint}>
                  Tap to see translations
                </Text>
              </View>
            ) : (
              // Back side - Translations
              <View style={styles.flashCardContent}>
                <View style={styles.flashCardBadges}>
                  <View style={[styles.languageBadge, styles.translationsBadge]}>
                    <Text style={styles.languageBadgeText}>Translations</Text>
                  </View>
                </View>

                <ScrollView style={styles.translationsScroll}>
                  {Object.entries(currentCard.translations).map(([langCode, translation]) => {
                    const lang = getLanguageByCode(langCode);
                    return (
                      <View key={langCode} style={styles.translationCard}>
                        <View style={styles.translationHeader}>
                          <Text style={styles.translationLanguage}>
                            {lang?.nativeName || langCode}
                          </Text>
                          <TouchableOpacity
                            style={styles.translationSpeakButton}
                            onPress={() => onSpeak(translation, langCode)}
                          >
                            <Text style={styles.translationSpeakText}>🔊</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.translationText}>{translation}</Text>
                      </View>
                    );
                  })}
                </ScrollView>

                <Text style={styles.tapHint}>
                  Tap to see source text
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButtonLarge, styles.dontKnowButton]}
            onPress={markAsNotUnderstood}
          >
            <Text style={styles.actionButtonLargeIcon}>✗</Text>
            <Text style={styles.actionButtonLargeText}>Don't Know</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navigationButton}
            onPress={prevCard}
            disabled={currentCardIndex === 0}
          >
            <Text style={styles.navigationButtonText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navigationButton}
            onPress={() => setIsFlipped(!isFlipped)}
          >
            <Text style={styles.navigationButtonText}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navigationButton}
            onPress={nextCard}
            disabled={currentCardIndex === selectedItems.length - 1}
          >
            <Text style={styles.navigationButtonText}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButtonLarge, styles.knowButton]}
            onPress={markAsUnderstood}
          >
            <Text style={styles.actionButtonLargeIcon}>✓</Text>
            <Text style={styles.actionButtonLargeText}>I Know</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ResultsScreen = () => {
    const reviewedCards = swipeResults.length;
    const percentage = reviewedCards > 0 ? Math.round((understoodCount / reviewedCards) * 100) : 0;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Study Results</Text>
          <Text style={styles.headerSubtitle}>
            Flash card session completed
          </Text>
        </View>

        <View style={styles.resultsContent}>
          {/* Overall Statistics */}
          <View style={styles.overallStats}>
            <Text style={styles.percentageText}>{percentage}%</Text>
            <Text style={styles.percentageLabel}>Understanding</Text>
          </View>

          {/* Detailed Results */}
          <View style={styles.detailedResults}>
            <View style={styles.resultCard}>
              <Text style={styles.resultIcon}>✓</Text>
              <Text style={styles.resultNumber}>{understoodCount}</Text>
              <Text style={styles.resultLabel}>Understood</Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultIcon}>✗</Text>
              <Text style={styles.resultNumber}>{notUnderstoodCount}</Text>
              <Text style={styles.resultLabel}>Need Review</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.resultsActions}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => {
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setSwipeResults([]);
                setActiveTab("study");
              }}
            >
              <Text style={styles.primaryActionButtonText}>🔄 Study Again</Text>
            </TouchableOpacity>

            {notUnderstoodCount > 0 && (
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => {
                  const notUnderstoodCards = selectedItems.filter(item =>
                    swipeResults.find(r => r.cardId === item.id && !r.understood)
                  );
                  setSelectedItems(notUnderstoodCards);
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                  setSwipeResults([]);
                  setActiveTab("study");
                }}
              >
                <Text style={styles.secondaryActionButtonText}>
                  ✗ Review Unknown Cards ({notUnderstoodCount})
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.ghostActionButton}
              onPress={() => setActiveTab("select")}
            >
              <Text style={styles.ghostActionButtonText}>← Back to Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {activeTab === "select" ? <SelectionScreen /> :
       activeTab === "results" ? <ResultsScreen /> : <StudyScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    height: 64,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  quickActionButtonDisabled: {
    opacity: 0.5,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionText: {
    fontSize: 12,
    color: "#000000",
    textAlign: "center",
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    maxWidth: "48%",
  },
  categoryButtonDisabled: {
    opacity: 0.5,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryButtonText: {
    fontSize: 12,
    color: "#000000",
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginVertical: 24,
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tab: {
    backgroundColor: "#030213",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  tabText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  itemsList: {
    gap: 12,
    marginBottom: 24,
  },
  itemCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 4,
  },
  languageBadge: {
    backgroundColor: "#030213",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  languageBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "500",
  },
  translationsBadge: {
    backgroundColor: "#666666",
  },
  heartIcon: {
    fontSize: 12,
  },
  toneBadge: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  toneBadgeText: {
    fontSize: 10,
    color: "#666666",
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 10,
    color: "#666666",
    marginLeft: "auto",
  },
  itemSourceText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  translationsPreview: {
    gap: 4,
  },
  translationPreviewText: {
    fontSize: 12,
    color: "#666666",
  },
  moreTranslationsText: {
    fontSize: 10,
    color: "#999999",
  },
  studyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: "#030213",
  },
  progressInfo: {
    alignItems: "center",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  progressSubtext: {
    fontSize: 12,
    color: "#666666",
  },
  studyActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonText: {
    fontSize: 16,
  },
  swipeInstructions: {
    alignItems: "center",
    paddingVertical: 8,
  },
  swipeInstructionText: {
    fontSize: 12,
    color: "#666666",
  },
  progressIndicators: {
    position: "absolute",
    top: 120,
    right: 16,
    gap: 8,
    zIndex: 10,
  },
  progressIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressIndicatorIcon: {
    fontSize: 12,
    color: "#10b981",
  },
  progressIndicatorText: {
    fontSize: 12,
    color: "#666666",
  },
  flashCardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  flashCard: {
    width: screenWidth - 64,
    height: 320,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  flashCardContent: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  flashCardBadges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  flashCardText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 16,
  },
  speakButton: {
    backgroundColor: "#f3f3f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  speakButtonText: {
    fontSize: 14,
    color: "#030213",
  },
  tapHint: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  translationsScroll: {
    flex: 1,
    width: "100%",
  },
  translationCard: {
    backgroundColor: "rgba(243, 243, 245, 0.3)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  translationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  translationLanguage: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
  },
  translationSpeakButton: {
    padding: 4,
  },
  translationSpeakText: {
    fontSize: 12,
  },
  translationText: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  actionButtonLarge: {
    flex: 1,
    maxWidth: 120,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  dontKnowButton: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  knowButton: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
  },
  actionButtonLargeIcon: {
    fontSize: 20,
    color: "#000000",
  },
  actionButtonLargeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
  },
  navigationButton: {
    width: 40,
    height: 40,
    backgroundColor: "#f3f3f5",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationButtonText: {
    fontSize: 16,
    color: "#030213",
  },
  resultsContent: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  overallStats: {
    alignItems: "center",
    backgroundColor: "rgba(243, 243, 245, 0.3)",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    width: "100%",
    maxWidth: 300,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  percentageLabel: {
    fontSize: 14,
    color: "#666666",
  },
  detailedResults: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
    width: "100%",
    maxWidth: 300,
  },
  resultCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
  },
  resultIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  resultNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 12,
    color: "#666666",
  },
  resultsActions: {
    width: "100%",
    maxWidth: 300,
    gap: 12,
  },
  primaryActionButton: {
    backgroundColor: "#030213",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryActionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  secondaryActionButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#030213",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryActionButtonText: {
    color: "#030213",
    fontSize: 16,
    fontWeight: "500",
  },
  ghostActionButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    alignItems: "center",
  },
  ghostActionButtonText: {
    color: "#666666",
    fontSize: 14,
  },
});