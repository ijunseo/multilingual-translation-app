import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Button } from "./ui/button";
import { IAPPayment } from "./IAPPayment";

export type TranslationDirection =
  | "ja-to-en-ko"
  | "ko-to-ja-en"
  | "en-to-ja-ko"
  | "all-to-all";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface MultiTranslationHistoryItem {
  id: string;
  sourceText: string;
  translations: Record<string, string>;
  sourceLanguage: string;
  timestamp: Date;
  category?: string;
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

interface UserSubscription {
  planId: 'free' | 'basic' | 'premium';
  isActive: boolean;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  willCancelAt: Date | null;
}

interface MobileSettingsProps {
  translationDirection: TranslationDirection;
  onTranslationDirectionChange: (direction: TranslationDirection) => void;
  enabledLanguages: string[];
  onLanguageToggle: (languageCode: string) => void;
  allLanguages: Language[];
  languageOrder: string[];
  onLanguageOrderChange: (newOrder: string[]) => void;
  phrasebook: MultiTranslationHistoryItem[];
  phrasebookCategories: PhrasebookCategory[];
  userSubscription: UserSubscription;
  subscriptionPlans: SubscriptionPlan[];
  onUpgradeSubscription: (planId: 'basic' | 'premium', billingCycle: 'monthly' | 'yearly') => void;
  onCancelSubscription: (immediate?: boolean) => void;
  onReactivateSubscription: () => void;
}

export function MobileSettings({
  translationDirection,
  onTranslationDirectionChange,
  enabledLanguages,
  onLanguageToggle,
  allLanguages,
  languageOrder,
  onLanguageOrderChange,
  phrasebook,
  phrasebookCategories,
  userSubscription,
  subscriptionPlans,
  onUpgradeSubscription,
  onCancelSubscription,
  onReactivateSubscription,
}: MobileSettingsProps) {
  const [selectedTab, setSelectedTab] = useState<"languages" | "subscription" | "export">("languages");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<'basic' | 'premium' | null>(null);

  const getCurrentPlan = () => {
    return subscriptionPlans.find(plan => plan.id === userSubscription.planId) || subscriptionPlans[0];
  };

  const exportPhrasebookToPDF = async () => {
    const currentPlan = getCurrentPlan();

    if (!currentPlan.pdfExport) {
      Alert.alert(
        "PDF Export Unavailable",
        "PDF export is only available for Basic and Premium subscribers. Please upgrade your plan.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => setSelectedTab("subscription") }
        ]
      );
      return;
    }

    if (phrasebook.length === 0) {
      Alert.alert("No Data", "Your phrasebook is empty. Add some phrases to export.");
      return;
    }

    try {
      // Group phrases by category
      const groupedPhrases: Record<string, MultiTranslationHistoryItem[]> = {};
      phrasebook.forEach(phrase => {
        const categoryId = phrase.category || "general";
        if (!groupedPhrases[categoryId]) {
          groupedPhrases[categoryId] = [];
        }
        groupedPhrases[categoryId].push(phrase);
      });

      // Generate HTML content for PDF
      const htmlContent = generatePhrasebookHTML(groupedPhrases);

      // Create PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        margins: {
          left: 30,
          top: 50,
          right: 30,
          bottom: 50,
        },
      });

      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Phrasebook PDF',
        UTI: 'com.adobe.pdf',
      });

      Alert.alert("Success", "Phrasebook exported successfully!");
    } catch (error) {
      console.error('PDF export error:', error);
      Alert.alert("Error", "Failed to export PDF. Please try again.");
    }
  };

  const generatePhrasebookHTML = (groupedPhrases: Record<string, MultiTranslationHistoryItem[]>) => {
    const getCategoryName = (categoryId: string) => {
      const category = phrasebookCategories.find(cat => cat.id === categoryId);
      return category ? category.name : "General";
    };

    const getLanguageName = (langCode: string) => {
      const language = allLanguages.find(lang => lang.code === langCode);
      return language ? language.nativeName : langCode;
    };

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>My Phrasebook</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #030213;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #030213;
            font-size: 28px;
            margin: 0;
          }
          .header .subtitle {
            color: #666;
            font-size: 14px;
            margin-top: 10px;
          }
          .category {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .category-title {
            color: #030213;
            font-size: 20px;
            font-weight: bold;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .phrase {
            margin-bottom: 25px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            background-color: #fafafa;
            page-break-inside: avoid;
          }
          .source {
            font-weight: bold;
            font-size: 16px;
            color: #030213;
            margin-bottom: 10px;
          }
          .source-meta {
            font-size: 12px;
            color: #666;
            margin-bottom: 15px;
          }
          .translations {
            display: grid;
            gap: 8px;
          }
          .translation {
            padding: 8px 12px;
            background-color: white;
            border-radius: 6px;
            border-left: 3px solid #030213;
          }
          .translation-lang {
            font-weight: bold;
            font-size: 12px;
            color: #666;
            margin-bottom: 2px;
          }
          .translation-text {
            font-size: 14px;
            color: #333;
          }
          .metadata {
            font-size: 11px;
            color: #999;
            margin-top: 10px;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>My Phrasebook</h1>
          <div class="subtitle">Exported on ${new Date().toLocaleDateString()}</div>
          <div class="subtitle">${phrasebook.length} phrases</div>
        </div>
    `;

    Object.entries(groupedPhrases).forEach(([categoryId, phrases]) => {
      html += `
        <div class="category">
          <h2 class="category-title">${getCategoryName(categoryId)}</h2>
      `;

      phrases.forEach(phrase => {
        html += `
          <div class="phrase">
            <div class="source">${phrase.sourceText}</div>
            <div class="source-meta">
              ${getLanguageName(phrase.sourceLanguage)}
              ${phrase.tone ? ` • ${phrase.tone.charAt(0).toUpperCase() + phrase.tone.slice(1)} style` : ''}
            </div>
            <div class="translations">
        `;

        Object.entries(phrase.translations).forEach(([langCode, translation]) => {
          html += `
            <div class="translation">
              <div class="translation-lang">${getLanguageName(langCode)}</div>
              <div class="translation-text">${translation}</div>
            </div>
          `;
        });

        html += `
            </div>
            <div class="metadata">Added: ${phrase.timestamp.toLocaleDateString()}</div>
          </div>
        `;
      });

      html += `</div>`;
    });

    html += `
      </body>
      </html>
    `;

    return html;
  };

  const handleLanguageToggle = (languageCode: string) => {
    if (enabledLanguages.includes(languageCode) && enabledLanguages.length <= 2) {
      Alert.alert("Error", "At least 2 languages must be enabled");
      return;
    }
    onLanguageToggle(languageCode);
  };

  const moveLanguageUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...languageOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onLanguageOrderChange(newOrder);
  };

  const moveLanguageDown = (index: number) => {
    if (index >= languageOrder.length - 1) return;
    const newOrder = [...languageOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onLanguageOrderChange(newOrder);
  };

  const ReorderableLanguageItem = ({ language, index, totalCount }: { language: Language; index: number; totalCount: number }) => {
    return (
      <View style={styles.languageItem}>
        <View style={styles.reorderControls}>
          <TouchableOpacity
            style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
            onPress={() => moveLanguageUp(index)}
            disabled={index === 0}
          >
            <Text style={[styles.reorderButtonText, index === 0 && styles.reorderButtonTextDisabled]}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderButton, index >= totalCount - 1 && styles.reorderButtonDisabled]}
            onPress={() => moveLanguageDown(index)}
            disabled={index >= totalCount - 1}
          >
            <Text style={[styles.reorderButtonText, index >= totalCount - 1 && styles.reorderButtonTextDisabled]}>↓</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.languageInfo}>
          <Text style={styles.languageName}>{language.nativeName}</Text>
          <Text style={styles.languageSubname}>{language.name}</Text>
        </View>
        <Switch
          value={enabledLanguages.includes(language.code)}
          onValueChange={() => handleLanguageToggle(language.code)}
          trackColor={{ false: "#f3f3f5", true: "#030213" }}
          thumbColor={enabledLanguages.includes(language.code) ? "#ffffff" : "#ffffff"}
        />
      </View>
    );
  };

  const handleUpgrade = (planId: 'basic' | 'premium') => {
    // 決済画面を表示
    setSelectedPlanForPayment(planId);
    setShowPaymentSheet(true);
  };

  const handlePaymentSuccess = () => {
    // 決済成功時の処理
    setShowPaymentSheet(false);

    if (selectedPlanForPayment) {
      onUpgradeSubscription(selectedPlanForPayment, billingCycle);
    }

    setSelectedPlanForPayment(null);
  };

  const handlePaymentCancel = () => {
    // 決済キャンセル時の処理
    setShowPaymentSheet(false);
    setSelectedPlanForPayment(null);
  };

  const handleCancelSubscription = (immediate: boolean = false) => {
    Alert.alert(
      "Cancel Subscription",
      immediate
        ? "Are you sure you want to cancel your subscription immediately? You'll lose access to premium features right away."
        : "Your subscription will remain active until the end of your current billing period. You'll still have access to all features until then.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: immediate ? "Cancel Now" : "Cancel at Period End",
          style: "destructive",
          onPress: () => {
            onCancelSubscription(immediate);
            Alert.alert(
              "Subscription Cancelled",
              immediate
                ? "Your subscription has been cancelled immediately"
                : "Your subscription will be cancelled at the end of the current period"
            );
          }
        }
      ]
    );
  };

  const handleReactivateSubscription = () => {
    onReactivateSubscription();
    Alert.alert("Success", "Subscription reactivated successfully!");
  };

  const generatePhrasebookPDF = () => {
    if (phrasebook.length === 0) {
      Alert.alert("Error", "No phrases in phrasebook to export");
      return;
    }

    const currentPlan = getCurrentPlan();
    if (!currentPlan.pdfExport) {
      Alert.alert("Error", "PDF export is only available for Basic and Premium plans");
      return;
    }

    Alert.alert("Export PDF", "PDF export feature would open here in a real app");
  };

  const renderLanguageSettings = () => {
    // Sort languages by the current order
    const orderedLanguages = languageOrder
      .map(code => allLanguages.find(lang => lang.code === code))
      .filter(Boolean) as Language[];

    // Add any languages not in the order (fallback)
    allLanguages.forEach(lang => {
      if (!orderedLanguages.find(ordered => ordered.code === lang.code)) {
        orderedLanguages.push(lang);
      }
    });

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Translation Languages</Text>
        <Text style={styles.sectionDescription}>
          Select which languages to include in translations. Use ↑↓ buttons to reorder. At least 2 languages must be enabled.
        </Text>

        <View style={styles.languageList}>
          {orderedLanguages.map((language, index) => (
            <ReorderableLanguageItem
              key={language.code}
              language={language}
              index={index}
              totalCount={orderedLanguages.length}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderSubscriptionSettings = () => {
    const currentPlan = getCurrentPlan();

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <Text style={styles.sectionDescription}>
          Upgrade your plan to unlock more features and increase your phrasebook limit.
        </Text>

        {/* Current Plan Status */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planInfo}>
              <Text style={styles.planIcon}>
                {userSubscription.planId === 'free' ? '⭐' :
                 userSubscription.planId === 'basic' ? '⚡' : '👑'}
              </Text>
              <View>
                <Text style={styles.planName}>{currentPlan.name} Plan</Text>
                <Text style={styles.planUsage}>
                  {phrasebook.length} / {currentPlan.phrasebookLimit} phrases used
                </Text>
              </View>
            </View>
            <View style={[
              styles.planBadge,
              userSubscription.planId === 'free' ? styles.planBadgeSecondary :
              userSubscription.willCancelAt ? styles.planBadgeDestructive : styles.planBadgeDefault
            ]}>
              <Text style={styles.planBadgeText}>
                {userSubscription.planId === 'free' ? 'Free' :
                 userSubscription.willCancelAt ? 'Cancelling' : 'Active'}
              </Text>
            </View>
          </View>

          {/* Subscription Status */}
          {userSubscription.expiresAt && !userSubscription.willCancelAt && (
            <Text style={styles.expirationText}>
              Expires: {userSubscription.expiresAt.toLocaleDateString()}
            </Text>
          )}

          {userSubscription.willCancelAt && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <View>
                <Text style={styles.warningTitle}>Subscription Cancelled</Text>
                <Text style={styles.warningSubtitle}>
                  Will downgrade to Free on {userSubscription.willCancelAt.toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}

          {/* Plan Features */}
          <View style={styles.planFeatures}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Up to {currentPlan.phrasebookLimit} saved phrases</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>{currentPlan.pdfExport ? '✓' : '×'}</Text>
              <Text style={[
                styles.featureText,
                !currentPlan.pdfExport && styles.featureTextDisabled
              ]}>
                PDF Export
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.planActions}>
            {userSubscription.planId === 'free' && !userSubscription.cancelledAt && (
              <>
                <TouchableOpacity
                  style={[styles.upgradeButton, styles.upgradeButtonOutline]}
                  onPress={() => handleUpgrade('basic')}
                >
                  <Text style={styles.upgradeButtonTextOutline}>
                    ⚡ Upgrade to Basic (¥580/month)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => handleUpgrade('premium')}
                >
                  <Text style={styles.upgradeButtonText}>
                    👑 Upgrade to Premium (¥1,800/month)
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {(userSubscription.planId === 'basic' || userSubscription.planId === 'premium') && !userSubscription.willCancelAt && (
              <>
                {userSubscription.planId === 'basic' && (
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => handleUpgrade('premium')}
                  >
                    <Text style={styles.upgradeButtonText}>
                      👑 Upgrade to Premium (¥1,800/month)
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.upgradeButton, styles.upgradeButtonOutline]}
                  onPress={() => handleCancelSubscription(false)}
                >
                  <Text style={styles.upgradeButtonTextOutline}>Cancel Subscription</Text>
                </TouchableOpacity>
              </>
            )}

            {userSubscription.willCancelAt && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleReactivateSubscription}
              >
                <Text style={styles.upgradeButtonText}>
                  🔄 Reactivate Subscription
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Billing Cycle Toggle */}
        {userSubscription.planId === 'free' && (
          <View style={styles.billingCycleContainer}>
            <Text style={styles.billingCycleTitle}>Billing Cycle</Text>
            <View style={styles.billingCycleToggle}>
              <TouchableOpacity
                style={[
                  styles.billingCycleOption,
                  billingCycle === 'monthly' && styles.billingCycleOptionActive
                ]}
                onPress={() => setBillingCycle('monthly')}
              >
                <Text style={[
                  styles.billingCycleOptionText,
                  billingCycle === 'monthly' && styles.billingCycleOptionTextActive
                ]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.billingCycleOption,
                  billingCycle === 'yearly' && styles.billingCycleOptionActive
                ]}
                onPress={() => setBillingCycle('yearly')}
              >
                <Text style={[
                  styles.billingCycleOptionText,
                  billingCycle === 'yearly' && styles.billingCycleOptionTextActive
                ]}>
                  Yearly
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pricing Plans */}
        {userSubscription.planId === 'free' && (
          <View style={styles.pricingPlans}>
            <Text style={styles.pricingTitle}>Choose Your Plan</Text>
            {subscriptionPlans.slice(1).map((plan) => (
              <View key={plan.id} style={styles.pricingCard}>
                <View style={styles.pricingHeader}>
                  <Text style={styles.pricingPlanName}>{plan.name}</Text>
                  <Text style={styles.pricingPrice}>
                    ¥{billingCycle === 'monthly'
                      ? plan.monthlyPrice.toLocaleString() + '/month'
                      : plan.yearlyPrice.toLocaleString() + '/year'
                    }
                  </Text>
                </View>
                {billingCycle === 'yearly' && (
                  <Text style={styles.pricingSavings}>
                    Save ¥{(plan.monthlyPrice * 12 - plan.yearlyPrice).toLocaleString()}
                  </Text>
                )}
                <View style={styles.pricingFeatures}>
                  <View style={styles.pricingFeature}>
                    <Text style={styles.pricingFeatureIcon}>✓</Text>
                    <Text style={styles.pricingFeatureText}>{plan.phrasebookLimit} saved phrases</Text>
                  </View>
                  <View style={styles.pricingFeature}>
                    <Text style={styles.pricingFeatureIcon}>✓</Text>
                    <Text style={styles.pricingFeatureText}>PDF Export</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.pricingButton,
                    plan.id === 'premium' ? styles.pricingButtonPrimary : styles.pricingButtonSecondary
                  ]}
                  onPress={() => handleUpgrade(plan.id as 'basic' | 'premium')}
                >
                  <Text style={[
                    styles.pricingButtonText,
                    plan.id === 'premium' ? styles.pricingButtonTextPrimary : styles.pricingButtonTextSecondary
                  ]}>
                    Choose {plan.name}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderExportSettings = () => {
    const currentPlan = getCurrentPlan();

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export</Text>
        <Text style={styles.sectionDescription}>
          Export your saved phrases and phrasebook data.
        </Text>

        <View style={styles.exportCard}>
          <View style={styles.exportHeader}>
            <View style={styles.exportInfo}>
              <Text style={styles.exportIcon}>📄</Text>
              <View>
                <Text style={styles.exportTitle}>Export Phrasebook as PDF</Text>
                <Text style={styles.exportSubtitle}>
                  {phrasebook.length} phrases ready for export
                </Text>
              </View>
            </View>
            <View style={[
              styles.exportBadge,
              currentPlan.pdfExport ? styles.exportBadgeAvailable : styles.exportBadgePremium
            ]}>
              <Text style={styles.exportBadgeText}>
                {currentPlan.pdfExport ? "Available" : "Premium Only"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.exportButton,
              (!currentPlan.pdfExport || phrasebook.length === 0) && styles.exportButtonDisabled
            ]}
            onPress={exportPhrasebookToPDF}
            disabled={!currentPlan.pdfExport || phrasebook.length === 0}
          >
            <Text style={[
              styles.exportButtonText,
              (!currentPlan.pdfExport || phrasebook.length === 0) && styles.exportButtonTextDisabled
            ]}>
              📥 {!currentPlan.pdfExport
                ? "Upgrade to Export PDF"
                : phrasebook.length === 0
                  ? "No Phrases to Export"
                  : `Export PDF (${phrasebook.length} phrases)`
              }
            </Text>
          </TouchableOpacity>

          {!currentPlan.pdfExport && (
            <Text style={styles.exportDisclaimer}>
              PDF export is available with Basic and Premium plans
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Payment Sheet Modal */}
      <Modal
        visible={showPaymentSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={handlePaymentCancel}
      >
        {selectedPlanForPayment && (
          <IAPPayment
            planId={selectedPlanForPayment}
            billingCycle={billingCycle}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        )}
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "languages" && styles.tabActive]}
          onPress={() => setSelectedTab("languages")}
        >
          <Text style={[styles.tabText, selectedTab === "languages" && styles.tabTextActive]}>
            Languages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "subscription" && styles.tabActive]}
          onPress={() => setSelectedTab("subscription")}
        >
          <Text style={[styles.tabText, selectedTab === "subscription" && styles.tabTextActive]}>
            Subscription
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "export" && styles.tabActive]}
          onPress={() => setSelectedTab("export")}
        >
          <Text style={[styles.tabText, selectedTab === "export" && styles.tabTextActive]}>
            Export
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {selectedTab === "languages" && renderLanguageSettings()}
        {selectedTab === "subscription" && renderSubscriptionSettings()}
        {selectedTab === "export" && renderExportSettings()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#f3f3f5",
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#ffffff",
  },
  tabText: {
    fontSize: 14,
    color: "#666666",
  },
  tabTextActive: {
    color: "#030213",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
  },
  languageList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 8,
  },
  reorderControls: {
    flexDirection: "column",
    gap: 4,
    marginRight: 12,
  },
  reorderButton: {
    backgroundColor: "#e5e5e5",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    minHeight: 24,
  },
  reorderButtonDisabled: {
    backgroundColor: "#f3f3f5",
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#030213",
  },
  reorderButtonTextDisabled: {
    color: "#cccccc",
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  languageSubname: {
    fontSize: 14,
    color: "#666666",
  },
  planCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  planInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planIcon: {
    fontSize: 20,
  },
  planName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  planUsage: {
    fontSize: 14,
    color: "#666666",
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planBadgeSecondary: {
    backgroundColor: "#f3f3f5",
  },
  planBadgeDefault: {
    backgroundColor: "#030213",
  },
  planBadgeDestructive: {
    backgroundColor: "#ef4444",
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
  },
  expirationText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    gap: 8,
  },
  warningIcon: {
    fontSize: 16,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#92400e",
  },
  warningSubtitle: {
    fontSize: 10,
    color: "#92400e",
  },
  planFeatures: {
    gap: 8,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureIcon: {
    fontSize: 14,
    color: "#10b981",
  },
  featureText: {
    fontSize: 14,
    color: "#000000",
  },
  featureTextDisabled: {
    color: "#666666",
  },
  planActions: {
    gap: 8,
  },
  upgradeButton: {
    backgroundColor: "#030213",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  upgradeButtonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#030213",
  },
  upgradeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  upgradeButtonTextOutline: {
    color: "#030213",
    fontSize: 14,
    fontWeight: "500",
  },
  billingCycleContainer: {
    marginBottom: 16,
  },
  billingCycleTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  billingCycleToggle: {
    flexDirection: "row",
    backgroundColor: "#f3f3f5",
    borderRadius: 8,
    padding: 4,
  },
  billingCycleOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  billingCycleOptionActive: {
    backgroundColor: "#ffffff",
  },
  billingCycleOptionText: {
    fontSize: 14,
    color: "#666666",
  },
  billingCycleOptionTextActive: {
    color: "#030213",
    fontWeight: "500",
  },
  pricingPlans: {
    gap: 12,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 12,
  },
  pricingCard: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
    padding: 16,
  },
  pricingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  pricingPlanName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  pricingPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  pricingSavings: {
    fontSize: 12,
    color: "#10b981",
    textAlign: "right",
    marginBottom: 8,
  },
  pricingFeatures: {
    gap: 4,
    marginBottom: 12,
  },
  pricingFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pricingFeatureIcon: {
    fontSize: 12,
    color: "#10b981",
  },
  pricingFeatureText: {
    fontSize: 14,
    color: "#666666",
  },
  pricingButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  pricingButtonPrimary: {
    backgroundColor: "#030213",
  },
  pricingButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#030213",
  },
  pricingButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  pricingButtonTextPrimary: {
    color: "#ffffff",
  },
  pricingButtonTextSecondary: {
    color: "#030213",
  },
  exportCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
  },
  exportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  exportInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  exportIcon: {
    fontSize: 20,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  exportSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  exportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exportBadgeAvailable: {
    backgroundColor: "#030213",
  },
  exportBadgePremium: {
    backgroundColor: "#f3f3f5",
  },
  exportBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
  },
  exportButton: {
    backgroundColor: "#030213",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  exportButtonDisabled: {
    backgroundColor: "#f3f3f5",
  },
  exportButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  exportButtonTextDisabled: {
    color: "#666666",
  },
  exportDisclaimer: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
});