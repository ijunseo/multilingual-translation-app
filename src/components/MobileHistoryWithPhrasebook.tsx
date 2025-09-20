import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert
} from "react-native";
import { Button } from "./ui/button";

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

interface SubscriptionPlan {
  id: 'free' | 'basic' | 'premium';
  name: string;
  phrasebookLimit: number;
  pdfExport: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
}

interface MobileHistoryWithPhrasebookProps {
  history: MultiTranslationHistoryItem[];
  phrasebook: MultiTranslationHistoryItem[];
  phrasebookCategories: PhrasebookCategory[];
  allLanguages: { code: string; name: string; nativeName: string }[];
  onHistorySelect: (item: MultiTranslationHistoryItem) => void;
  onClearHistory: () => void;
  onToggleFavorite: (item: MultiTranslationHistoryItem, categoryId?: string) => void;
  onRemoveFromPhrasebook: (id: string) => void;
  onAddCategory: (name: string, color: string) => string;
  onUpdateCategory: (id: string, name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
  onMoveToCategory: (itemId: string, categoryId: string) => void;
  canAddToPhrasebook: () => boolean;
  currentPlan: SubscriptionPlan;
  onSpeak: (text: string, language: string) => void;
}

export function MobileHistoryWithPhrasebook({
  history,
  phrasebook,
  phrasebookCategories,
  allLanguages,
  onHistorySelect,
  onClearHistory,
  onToggleFavorite,
  onRemoveFromPhrasebook,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onMoveToCategory,
  canAddToPhrasebook,
  currentPlan,
  onSpeak,
}: MobileHistoryWithPhrasebookProps) {
  const [activeTab, setActiveTab] = useState<"phrasebook" | "history">("phrasebook");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

  const getLanguageByCode = (code: string) => {
    return allLanguages.find(lang => lang.code === code);
  };

  const isInPhrasebook = (itemId: string) => {
    return phrasebook.some(item => item.id === itemId);
  };

  const getCategoryById = (id: string) => {
    return phrasebookCategories.find(cat => cat.id === id);
  };

  const searchInItem = (item: MultiTranslationHistoryItem, query: string) => {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return true;

    if (item.sourceText.toLowerCase().includes(searchTerm)) return true;

    const translationValues = Object.values(item.translations);
    if (translationValues.some(translation => translation.toLowerCase().includes(searchTerm))) return true;

    const sourceLang = getLanguageByCode(item.sourceLanguage);
    if (sourceLang && (
      sourceLang.name.toLowerCase().includes(searchTerm) ||
      sourceLang.nativeName.toLowerCase().includes(searchTerm)
    )) return true;

    if (item.category) {
      const category = getCategoryById(item.category);
      if (category && category.name.toLowerCase().includes(searchTerm)) return true;
    }

    return false;
  };

  const getFilteredPhrasebook = () => {
    let filtered = phrasebook;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(item => searchInItem(item, searchQuery));
    }

    return filtered;
  };

  const getFilteredHistory = () => {
    if (!searchQuery.trim()) return history;
    return history.filter(item => searchInItem(item, searchQuery));
  };

  const getCategoryItemCount = (categoryId: string) => {
    return phrasebook.filter(item => item.category === categoryId).length;
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName("");
      setNewCategoryColor("#3b82f6");
      setIsAddCategoryModalOpen(false);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (categoryId === "general") {
      Alert.alert("Error", "Cannot delete General category");
      return;
    }

    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category? All items will be moved to General.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onDeleteCategory(categoryId);
            if (selectedCategory === categoryId) {
              setSelectedCategory("all");
            }
          }
        }
      ]
    );
  };

  const renderHistoryItem = (item: MultiTranslationHistoryItem, showRemoveFromPhrasebook = false) => {
    const sourceLang = getLanguageByCode(item.sourceLanguage);
    const isFavorite = isInPhrasebook(item.id);
    const category = item.category ? getCategoryById(item.category) : null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.historyItem}
        onPress={() => onHistorySelect(item)}
      >
        {/* Header */}
        <View style={styles.historyItemHeader}>
          <View style={styles.languageBadge}>
            <Text style={styles.languageBadgeText}>
              {sourceLang?.nativeName || item.sourceLanguage}
            </Text>
          </View>
          <Text style={styles.arrowText}>→</Text>
          <Text style={styles.targetText}>All languages</Text>

          {/* Tone badge */}
          {item.tone && (
            <View style={styles.toneBadge}>
              <Text style={styles.toneBadgeText}>
                {item.tone.charAt(0).toUpperCase() + item.tone.slice(1)} Style
              </Text>
            </View>
          )}

          {/* Category badge */}
          {showRemoveFromPhrasebook && category && (
            <View style={[styles.categoryBadge, { backgroundColor: `${category.color}20` }]}>
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                {category.name}
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            {/* Favorite button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (showRemoveFromPhrasebook) {
                  onRemoveFromPhrasebook(item.id);
                } else {
                  if (isFavorite) {
                    onToggleFavorite(item);
                  } else {
                    if (!canAddToPhrasebook()) {
                      Alert.alert(
                        "Phrasebook Limit Reached",
                        `Phrasebook limit reached (${currentPlan.phrasebookLimit} phrases). Upgrade to add more.`
                      );
                      return;
                    }
                    onToggleFavorite(item);
                  }
                }
              }}
            >
              <Text style={[styles.actionButtonText, isFavorite && styles.favoriteActive]}>
                {isFavorite ? "❤️" : "🤍"}
              </Text>
            </TouchableOpacity>

            {/* Reuse button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onHistorySelect(item)}
            >
              <Text style={styles.actionButtonText}>🔄</Text>
            </TouchableOpacity>

            {/* Speak source text button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onSpeak(item.sourceText, item.sourceLanguage)}
            >
              <Text style={styles.actionButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Source text */}
        <Text style={styles.sourceText} numberOfLines={2}>
          {item.sourceText}
        </Text>

        {/* Translations */}
        <View style={styles.translationsContainer}>
          {Object.entries(item.translations).map(([langCode, translation]) => (
            <View key={langCode} style={styles.translationItem}>
              <View style={styles.translationContent}>
                <Text style={styles.translationText} numberOfLines={2}>
                  {translation}
                </Text>
                <TouchableOpacity
                  style={styles.translationSpeakButton}
                  onPress={() => onSpeak(translation, langCode)}
                >
                  <Text style={styles.translationSpeakButtonText}>🔊</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Timestamp */}
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </TouchableOpacity>
    );
  };

  const EmptyState = ({ title, description, icon }: { title: string; description: string; icon: string }) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );

  const predefinedColors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#06b6d4", "#84cc16", "#f97316",
    "#ec4899", "#6366f1", "#14b8a6", "#eab308"
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isSearchActive ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${activeTab === "phrasebook" ? "phrasebook" : "history"}...`}
              autoFocus
            />
            <TouchableOpacity
              style={styles.searchCloseButton}
              onPress={() => {
                setSearchQuery("");
                setIsSearchActive(false);
              }}
            >
              <Text style={styles.searchCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>History & Phrasebook</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerAction}
                onPress={() => setIsSearchActive(true)}
              >
                <Text style={styles.headerActionText}>🔍</Text>
              </TouchableOpacity>
              {activeTab === "history" && history.length > 0 && (
                <TouchableOpacity
                  style={styles.headerAction}
                  onPress={() => {
                    Alert.alert(
                      "Clear History",
                      "Are you sure you want to clear all history?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Clear", style: "destructive", onPress: onClearHistory }
                      ]
                    );
                  }}
                >
                  <Text style={styles.headerActionText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "phrasebook" && styles.activeTab]}
          onPress={() => {
            setActiveTab("phrasebook");
            setSearchQuery("");
          }}
        >
          <Text style={[styles.tabText, activeTab === "phrasebook" && styles.activeTabText]}>
            Phrasebook
          </Text>
          {phrasebook.length > 0 && (
            <View style={[
              styles.tabBadge,
              phrasebook.length >= currentPlan.phrasebookLimit && styles.tabBadgeWarning
            ]}>
              <Text style={styles.tabBadgeText}>
                {phrasebook.length}/{currentPlan.phrasebookLimit}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => {
            setActiveTab("history");
            setSearchQuery("");
          }}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "phrasebook" ? (
        phrasebook.length === 0 ? (
          <EmptyState
            title="No saved phrases"
            description="Tap the heart icon on any translation to save it to your phrasebook"
            icon="❤️"
          />
        ) : (
          <View style={styles.content}>
            {/* Subscription warning */}
            {phrasebook.length >= currentPlan.phrasebookLimit * 0.8 && (
              <View style={[
                styles.warningBanner,
                phrasebook.length >= currentPlan.phrasebookLimit && styles.warningBannerError
              ]}>
                <Text style={styles.warningIcon}>👑</Text>
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>
                    {phrasebook.length >= currentPlan.phrasebookLimit
                      ? 'Phrasebook limit reached!'
                      : 'Phrasebook almost full'
                    }
                  </Text>
                  <Text style={styles.warningSubtitle}>
                    {phrasebook.length >= currentPlan.phrasebookLimit
                      ? 'Upgrade to save more phrases'
                      : `${currentPlan.phrasebookLimit - phrasebook.length} phrases remaining`
                    }
                  </Text>
                </View>
              </View>
            )}

            {/* Category Filter */}
            {!searchQuery.trim() && (
              <View style={styles.categoryFilter}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>Categories</Text>
                  <TouchableOpacity
                    style={styles.addCategoryButton}
                    onPress={() => setIsAddCategoryModalOpen(true)}
                  >
                    <Text style={styles.addCategoryText}>➕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryChips}>
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      selectedCategory === "all" && styles.categoryChipActive
                    ]}
                    onPress={() => setSelectedCategory("all")}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory === "all" && styles.categoryChipTextActive
                    ]}>
                      All ({phrasebook.length})
                    </Text>
                  </TouchableOpacity>

                  {phrasebookCategories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        selectedCategory === category.id && { backgroundColor: category.color }
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <View style={[
                        styles.categoryDot,
                        { backgroundColor: selectedCategory === category.id ? 'white' : category.color }
                      ]} />
                      <Text style={[
                        styles.categoryChipText,
                        selectedCategory === category.id && styles.categoryChipTextActive
                      ]}>
                        {category.name} ({getCategoryItemCount(category.id)})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Search Results Info */}
            {searchQuery.trim() && (
              <View style={styles.searchResults}>
                <Text style={styles.searchResultsText}>
                  {getFilteredPhrasebook().length} results for "{searchQuery}"
                </Text>
              </View>
            )}

            {/* Phrasebook Items */}
            <ScrollView style={styles.itemsList}>
              {getFilteredPhrasebook().map((item) => renderHistoryItem(item, true))}
              {getFilteredPhrasebook().length === 0 && !searchQuery.trim() && selectedCategory !== "all" && (
                <EmptyState
                  title="No phrases in this category"
                  description="Move some phrases to this category or create new ones"
                  icon="📁"
                />
              )}
              {getFilteredPhrasebook().length === 0 && searchQuery.trim() && (
                <EmptyState
                  title="No phrases found"
                  description={`No phrases found for "${searchQuery}"`}
                  icon="🔍"
                />
              )}
            </ScrollView>
          </View>
        )
      ) : (
        // History tab
        history.length === 0 ? (
          <EmptyState
            title="No translation history"
            description="Start translating to see your history here"
            icon="🔄"
          />
        ) : (
          <ScrollView style={styles.itemsList}>
            {getFilteredHistory().map((item) => renderHistoryItem(item, false))}
          </ScrollView>
        )
      )}

      {/* Add Category Modal */}
      <Modal
        visible={isAddCategoryModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAddCategoryModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <Text style={styles.modalDescription}>
              Create a new category to organize your phrasebook items.
            </Text>

            <View style={styles.modalForm}>
              <Text style={styles.formLabel}>Category Name</Text>
              <TextInput
                style={styles.formInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Enter category name"
              />

              <Text style={styles.formLabel}>Category Color</Text>
              <View style={styles.colorGrid}>
                {predefinedColors.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                onPress={() => setIsAddCategoryModalOpen(false)}
                variant="outline"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleAddCategory}
                disabled={!newCategoryName.trim()}
                style={styles.modalButton}
              >
                Add Category
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#f3f3f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f3f5",
    alignItems: "center",
    justifyContent: "center",
  },
  searchCloseText: {
    fontSize: 14,
    color: "#666666",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerAction: {
    padding: 8,
  },
  headerActionText: {
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#f3f3f5",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  activeTab: {
    backgroundColor: "#ffffff",
  },
  tabText: {
    fontSize: 14,
    color: "#666666",
  },
  activeTabText: {
    color: "#030213",
    fontWeight: "500",
  },
  tabBadge: {
    backgroundColor: "#030213",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
  },
  tabBadgeWarning: {
    backgroundColor: "#f59e0b",
  },
  tabBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
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
  emptyDescription: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  warningBannerError: {
    backgroundColor: "#fecaca",
    borderColor: "#ef4444",
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#92400e",
    marginBottom: 2,
  },
  warningSubtitle: {
    fontSize: 12,
    color: "#92400e",
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  addCategoryButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f3f3f5",
    alignItems: "center",
    justifyContent: "center",
  },
  addCategoryText: {
    fontSize: 12,
  },
  categoryChips: {
    flexDirection: "row",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f3f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: "#030213",
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryChipText: {
    fontSize: 12,
    color: "#666666",
  },
  categoryChipTextActive: {
    color: "#ffffff",
  },
  searchResults: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(243, 243, 245, 0.3)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  searchResultsText: {
    fontSize: 14,
    color: "#666666",
  },
  itemsList: {
    flex: 1,
    padding: 16,
  },
  historyItem: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 4,
  },
  languageBadge: {
    backgroundColor: "#030213",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageBadgeText: {
    color: "#ffffff",
    fontSize: 12,
  },
  arrowText: {
    fontSize: 12,
    color: "#666666",
  },
  targetText: {
    fontSize: 12,
    color: "#666666",
  },
  toneBadge: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  toneBadgeText: {
    fontSize: 10,
    color: "#666666",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    marginLeft: "auto",
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 16,
  },
  favoriteActive: {
    color: "#ef4444",
  },
  sourceText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 12,
  },
  translationsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  translationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  translationContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  translationText: {
    flex: 1,
    fontSize: 12,
    color: "#666666",
  },
  translationSpeakButton: {
    marginLeft: 8,
    padding: 4,
  },
  translationSpeakButtonText: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: "#666666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
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
    marginBottom: 24,
  },
  modalForm: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#000000",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});