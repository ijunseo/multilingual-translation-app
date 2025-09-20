import { useState, useEffect, useCallback } from "react";
import { MobileSourceLanguageSelector } from "./components/MobileSourceLanguageSelector";
import { MobileToneSelector } from "./components/MobileToneSelector";
import { MobileTranslationInput } from "./components/MobileTranslationInput";
import { MultiTranslationOutput } from "./components/MultiTranslationOutput";
import { MobileHistoryWithPhrasebook } from "./components/MobileHistoryWithPhrasebook";
import { MobileSettings, TranslationDirection } from "./components/MobileSettings";
import { MobileFlashCard } from "./components/MobileFlashCard";
import { BottomNavigation } from "./components/BottomNavigation";
import { Button } from "./components/ui/button";
import { Languages } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { translationService } from "./services/translation";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface TranslationTone {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface MultiTranslationHistoryItem {
  id: string;
  sourceText: string;
  translations: Record<string, string>; // language code -> translation
  sourceLanguage: string;
  timestamp: Date;
  category?: string; // Optional category for phrasebook items
  tone?: string; // Translation tone used
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
  willCancelAt: Date | null; // For scheduled cancellations
}

const languages: Language[] = [
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "en-us", name: "English (US)", nativeName: "English (US)" },
  { code: "en-uk", name: "English (UK)", nativeName: "English (UK)" },
  { code: "en-au", name: "English (Australia)", nativeName: "English (Australia)" },
];

const translationTones: TranslationTone[] = [
  { id: "casual", name: "Casual", description: "Relaxed and friendly", icon: "" },
  { id: "neutral", name: "Neutral", description: "Standard and balanced", icon: "" },
  { id: "semi-formal", name: "Semi-formal", description: "Polite and professional", icon: "" },
  { id: "formal", name: "Formal", description: "Official and respectful", icon: "" },
];

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    phrasebookLimit: 10,
    pdfExport: false,
    monthlyPrice: 0,
    yearlyPrice: 0,
  },
  {
    id: 'basic',
    name: 'Basic',
    phrasebookLimit: 30,
    pdfExport: true,
    monthlyPrice: 580,
    yearlyPrice: 6000,
  },
  {
    id: 'premium',
    name: 'Premium',
    phrasebookLimit: 2000,
    pdfExport: true,
    monthlyPrice: 1800,
    yearlyPrice: 18000,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("translate");
  const [sourceLanguage, setSourceLanguage] = useState<Language>(languages[0]);
  const [sourceText, setSourceText] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<MultiTranslationHistoryItem[]>([]);
  const [phrasebook, setPhrasebook] = useState<MultiTranslationHistoryItem[]>([]);
  const [phrasebookCategories, setPhrasebookCategories] = useState<PhrasebookCategory[]>([
    { id: "general", name: "General", color: "#3b82f6", createdAt: new Date() },
    { id: "travel", name: "Travel", color: "#10b981", createdAt: new Date() },
    { id: "business", name: "Business", color: "#f59e0b", createdAt: new Date() },
    { id: "daily", name: "Daily Conversation", color: "#ef4444", createdAt: new Date() },
  ]);
  const [translationDirection, setTranslationDirection] = useState<TranslationDirection>("all-to-all");
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>(["ja", "ko", "en-us", "en-uk", "en-au"]); // Default: all languages enabled
  const [languageOrder, setLanguageOrder] = useState<string[]>(["ja", "ko", "en-us", "en-uk", "en-au"]); // Language display order
  const [userSubscription, setUserSubscription] = useState<UserSubscription>({
    planId: 'free',
    isActive: true,
    expiresAt: null,
    cancelledAt: null,
    willCancelAt: null,
  });
  const [selectedTone, setSelectedTone] = useState<string>("casual");
  const [isDarkMode] = useState(true); // Always dark mode

  // Get ordered languages based on user preference
  const getOrderedLanguages = useCallback((): Language[] => {
    const orderedLangs: Language[] = [];
    
    // Add languages in the specified order
    languageOrder.forEach(langCode => {
      const lang = languages.find(l => l.code === langCode);
      if (lang) {
        orderedLangs.push(lang);
      }
    });
    
    // Add any missing languages (in case new languages are added)
    languages.forEach(lang => {
      if (!orderedLangs.find(l => l.code === lang.code)) {
        orderedLangs.push(lang);
      }
    });
    
    return orderedLangs;
  }, [languageOrder]);

  // Get target languages (all languages except source)
  const getTargetLanguages = useCallback((sourceLang: Language): Language[] => {
    return getOrderedLanguages().filter(lang => lang.code !== sourceLang.code);
  }, [getOrderedLanguages]);

  // Get filtered target languages (based on enabled languages and excluding source)
  const getFilteredTargetLanguages = useCallback((sourceLang: Language): Language[] => {
    return getTargetLanguages(sourceLang).filter(lang => enabledLanguages.includes(lang.code));
  }, [getTargetLanguages, enabledLanguages]);

  const mockTranslate = useCallback(async (text: string, from: string, to: string, tone: string = "casual"): Promise<string> => {
    try {
      return await translationService.translateText({
        text,
        sourceLanguage: from,
        targetLanguage: to,
        tone
      });
    } catch (error) {
      console.error('Translation failed:', error);
      return `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }, []);

  const mockMultiTranslate = useCallback(async (text: string, from: string, targetLangs: string[], tone: string = "casual"): Promise<Record<string, string>> => {
    try {
      return await translationService.translateToMultipleLanguages(text, from, targetLangs, tone);
    } catch (error) {
      console.error('Multi-translation failed:', error);
      const fallbackResults: Record<string, string> = {};
      targetLangs.forEach(lang => {
        fallbackResults[lang] = `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      });
      return fallbackResults;
    }
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return;

    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Always translate to all languages for history, but filter display
      const allTargetLangs = getTargetLanguages(sourceLanguage);
      const allTargetCodes = allTargetLangs.map(lang => lang.code);
      const results = await mockMultiTranslate(sourceText, sourceLanguage.code, allTargetCodes, selectedTone);
      
      setTranslations(results);
      
      // Add to history (save all translations)
      const historyItem: MultiTranslationHistoryItem = {
        id: Date.now().toString(),
        sourceText,
        translations: results,
        sourceLanguage: sourceLanguage.code,
        timestamp: new Date(),
        tone: selectedTone,
      };
      
      setHistory(prev => [historyItem, ...prev.slice(0, 19)]); // Keep last 20 items
    } catch (error) {
      console.error("Translation failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, sourceLanguage, getTargetLanguages, mockMultiTranslate, selectedTone]);

  const handleLanguageToggle = (languageCode: string) => {
    setEnabledLanguages(prev => {
      const newEnabled = prev.includes(languageCode)
        ? prev.filter(code => code !== languageCode)
        : [...prev, languageCode];
      
      // Ensure at least 2 languages are always enabled
      if (newEnabled.length < 2) {
        return prev; // Don't change if it would result in less than 2 languages
      }
      
      return newEnabled;
    });
  };

  const handleLanguageOrderChange = (newOrder: string[]) => {
    setLanguageOrder(newOrder);
  };

  // Auto-adjust source language if it becomes disabled
  useEffect(() => {
    if (!enabledLanguages.includes(sourceLanguage.code)) {
      const firstEnabledLang = getOrderedLanguages().find(lang => enabledLanguages.includes(lang.code));
      if (firstEnabledLang) {
        setSourceLanguage(firstEnabledLang);
        setSourceText(""); // Clear text when changing source language
        setTranslations({}); // Clear translations
      }
    }
  }, [enabledLanguages, sourceLanguage.code, getOrderedLanguages]);

  // Auto-translate when source text changes
  useEffect(() => {
    if (sourceText.trim()) {
      const timeoutId = setTimeout(() => {
        handleTranslate();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setTranslations({});
    }
  }, [sourceText, sourceLanguage, selectedTone, handleTranslate]);

  // Save phrasebook to localStorage
  useEffect(() => {
    localStorage.setItem("phrasebook", JSON.stringify(phrasebook));
  }, [phrasebook]);

  // Save phrasebook categories to localStorage
  useEffect(() => {
    localStorage.setItem("phrasebookCategories", JSON.stringify(phrasebookCategories));
  }, [phrasebookCategories]);

  // Load phrasebook from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("phrasebook");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const phrasebookWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setPhrasebook(phrasebookWithDates);
      } catch (error) {
        console.error("Failed to load phrasebook from localStorage:", error);
      }
    }
  }, []);

  // Load phrasebook categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("phrasebookCategories");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const categoriesWithDates = parsed.map((category: any) => ({
          ...category,
          createdAt: new Date(category.createdAt)
        }));
        setPhrasebookCategories(categoriesWithDates);
      } catch (error) {
        console.error("Failed to load phrasebook categories from localStorage:", error);
      }
    }
  }, []);

  // Save enabled languages to localStorage
  useEffect(() => {
    localStorage.setItem("enabledLanguages", JSON.stringify(enabledLanguages));
  }, [enabledLanguages]);

  // Load enabled languages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("enabledLanguages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          setEnabledLanguages(parsed);
        }
      } catch (error) {
        console.error("Failed to load enabled languages from localStorage:", error);
      }
    }
  }, []);

  // Save language order to localStorage
  useEffect(() => {
    localStorage.setItem("languageOrder", JSON.stringify(languageOrder));
  }, [languageOrder]);

  // Load language order from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("languageOrder");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setLanguageOrder(parsed);
        }
      } catch (error) {
        console.error("Failed to load language order from localStorage:", error);
      }
    }
  }, []);

  // Save subscription to localStorage
  useEffect(() => {
    localStorage.setItem("userSubscription", JSON.stringify(userSubscription));
  }, [userSubscription]);

  // Load subscription from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("userSubscription");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const subscriptionWithDate = {
          ...parsed,
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
          cancelledAt: parsed.cancelledAt ? new Date(parsed.cancelledAt) : null,
          willCancelAt: parsed.willCancelAt ? new Date(parsed.willCancelAt) : null,
        };
        setUserSubscription(subscriptionWithDate);
      } catch (error) {
        console.error("Failed to load subscription from localStorage:", error);
      }
    }
  }, []);

  // Save selected tone to localStorage
  useEffect(() => {
    localStorage.setItem("selectedTone", selectedTone);
  }, [selectedTone]);

  // Load selected tone from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedTone");
    if (saved && translationTones.some(tone => tone.id === saved)) {
      setSelectedTone(saved);
    }
  }, []);

  // Apply light mode (remove dark class)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Check subscription status periodically
  useEffect(() => {
    checkSubscriptionStatus();
    
    // Check every hour
    const interval = setInterval(checkSubscriptionStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userSubscription.expiresAt, userSubscription.willCancelAt]);

  const handleHistorySelect = (item: MultiTranslationHistoryItem) => {
    const sourceLang = getOrderedLanguages().find(lang => lang.code === item.sourceLanguage);
    
    if (sourceLang) {
      setSourceLanguage(sourceLang);
      setSourceText(item.sourceText);
      setTranslations(item.translations);
      setActiveTab("translate"); // Switch to translate tab
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  // Check if subscription should be downgraded due to expiration or cancellation
  const checkSubscriptionStatus = () => {
    const now = new Date();
    
    // If subscription is cancelled and cancellation date has passed
    if (userSubscription.willCancelAt && now >= userSubscription.willCancelAt) {
      setUserSubscription({
        planId: 'free',
        isActive: true,
        expiresAt: null,
        cancelledAt: userSubscription.cancelledAt,
        willCancelAt: null,
      });
      
      // Handle phrasebook limit when downgrading to free
      handlePhrasebookDowngrade('free');
      return;
    }
    
    // If subscription has expired
    if (userSubscription.expiresAt && now >= userSubscription.expiresAt && !userSubscription.willCancelAt) {
      setUserSubscription(prev => ({
        planId: 'free',
        isActive: true,
        expiresAt: null,
        cancelledAt: now,
        willCancelAt: null,
      }));
      
      // Handle phrasebook limit when downgrading to free
      handlePhrasebookDowngrade('free');
    }
  };

  // Handle phrasebook when downgrading plan
  const handlePhrasebookDowngrade = (newPlanId: 'free' | 'basic' | 'premium') => {
    const newPlan = subscriptionPlans.find(plan => plan.id === newPlanId);
    if (!newPlan) return;

    if (phrasebook.length > newPlan.phrasebookLimit) {
      // Keep only the most recently added phrases within the new limit
      setPhrasebook(prev => prev.slice(0, newPlan.phrasebookLimit));
    }
  };

  // Get current subscription plan
  const getCurrentPlan = () => {
    return subscriptionPlans.find(plan => plan.id === userSubscription.planId) || subscriptionPlans[0];
  };

  // Check if user can add more phrases to phrasebook
  const canAddToPhrasebook = () => {
    const currentPlan = getCurrentPlan();
    return phrasebook.length < currentPlan.phrasebookLimit;
  };

  const toggleFavorite = (item: MultiTranslationHistoryItem, categoryId?: string) => {
    setPhrasebook(prev => {
      const exists = prev.find(p => p.id === item.id);
      if (exists) {
        // Remove from phrasebook
        return prev.filter(p => p.id !== item.id);
      } else {
        // Check subscription limits before adding
        const currentPlan = getCurrentPlan();
        if (prev.length >= currentPlan.phrasebookLimit) {
          // Show upgrade prompt or error
          return prev; // Don't add if limit exceeded
        }
        
        // Add to phrasebook with optional category
        const itemWithCategory = {
          ...item,
          category: categoryId || "general"
        };
        return [itemWithCategory, ...prev];
      }
    });
  };

  const removeFromPhrasebook = (id: string) => {
    setPhrasebook(prev => prev.filter(item => item.id !== id));
  };

  const addPhrasebookCategory = (name: string, color: string) => {
    const newCategory: PhrasebookCategory = {
      id: Date.now().toString(),
      name,
      color,
      createdAt: new Date()
    };
    setPhrasebookCategories(prev => [...prev, newCategory]);
    return newCategory.id;
  };

  const updatePhrasebookCategory = (id: string, name: string, color: string) => {
    setPhrasebookCategories(prev => 
      prev.map(category => 
        category.id === id 
          ? { ...category, name, color }
          : category
      )
    );
  };

  const deletePhrasebookCategory = (id: string) => {
    if (id === "general") return; // Cannot delete general category
    
    // Move all items in this category to general
    setPhrasebook(prev => 
      prev.map(item => 
        item.category === id 
          ? { ...item, category: "general" }
          : item
      )
    );
    
    setPhrasebookCategories(prev => prev.filter(category => category.id !== id));
  };

  const moveToCategory = (itemId: string, categoryId: string) => {
    setPhrasebook(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, category: categoryId }
          : item
      )
    );
  };

  const upgradeSubscription = (planId: 'basic' | 'premium', billingCycle: 'monthly' | 'yearly') => {
    // In a real app, this would handle payment processing
    const newSubscription: UserSubscription = {
      planId,
      isActive: true,
      expiresAt: billingCycle === 'monthly' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
      cancelledAt: null,
      willCancelAt: null,
    };
    setUserSubscription(newSubscription);
  };

  const cancelSubscription = (immediate: boolean = false) => {
    if (userSubscription.planId === 'free') return;

    const now = new Date();
    
    if (immediate) {
      // Immediate cancellation - downgrade to free now
      setUserSubscription({
        planId: 'free',
        isActive: true,
        expiresAt: null,
        cancelledAt: now,
        willCancelAt: null,
      });
      
      // Handle phrasebook limit when downgrading immediately
      handlePhrasebookDowngrade('free');
    } else {
      // Schedule cancellation at end of current period
      setUserSubscription(prev => ({
        ...prev,
        cancelledAt: now,
        willCancelAt: prev.expiresAt || now,
      }));
    }
  };

  const reactivateSubscription = () => {
    if (userSubscription.planId === 'free') return;

    setUserSubscription(prev => ({
      ...prev,
      cancelledAt: null,
      willCancelAt: null,
    }));
  };

  const speak = (text: string, language: string) => {
    if ('speechSynthesis' in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Map language codes to speech synthesis language codes
      const speechLangMap: Record<string, string> = {
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'en-us': 'en-US',
        'en-uk': 'en-GB',
        'en-au': 'en-AU',
      };
      utterance.lang = speechLangMap[language] || language;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceInput = () => {
    // Voice input functionality would be implemented here
    console.log("Voice input requested");
  };

  const getPlaceholder = (lang: Language) => {
    const placeholders = {
      ja: "翻訳したいテキストを入力してください",
      ko: "번역할 텍스트를 입력하세요",
      "en-us": "Enter text to translate",
      "en-uk": "Enter text to translate",
      "en-au": "Enter text to translate",
    };
    return placeholders[lang.code as keyof typeof placeholders] || "Enter text to translate";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <div className="safe-area-pt bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-center py-4 px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium">My Phrases</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-20">
        {activeTab === "translate" ? (
          <div className="flex-1 flex flex-col">
            {/* Language Selection */}
            <div className="py-4">
              <MobileSourceLanguageSelector
                languages={getOrderedLanguages().filter(lang => enabledLanguages.includes(lang.code))}
                sourceLanguage={sourceLanguage}
                onSourceLanguageChange={setSourceLanguage}
                translationDirection={translationDirection}
              />
            </div>

            {/* Tone Selection */}
            <div className="px-4 pb-4">
              <MobileToneSelector
                tones={translationTones}
                selectedTone={selectedTone}
                onToneChange={setSelectedTone}
              />
            </div>

            {/* Translation Input */}
            <div className="flex-1 px-4">
              <MobileTranslationInput
                value={sourceText}
                onChange={setSourceText}
                placeholder={getPlaceholder(sourceLanguage)}
                onVoiceInput={handleVoiceInput}
                onSpeak={() => speak(sourceText, sourceLanguage.code)}
                isLoading={isLoading}
              />
            </div>

            {/* Translation Output */}
            <div className="flex-1 px-4 py-4">
              <MultiTranslationOutput
                sourceText={sourceText}
                sourceLanguage={sourceLanguage}
                translations={translations}
                targetLanguages={getFilteredTargetLanguages(sourceLanguage)}
                isLoading={isLoading}
                onSpeak={speak}
              />
            </div>
          </div>
        ) : activeTab === "history" ? (
          <MobileHistoryWithPhrasebook
            history={history}
            phrasebook={phrasebook}
            phrasebookCategories={phrasebookCategories}
            allLanguages={getOrderedLanguages()}
            onHistorySelect={handleHistorySelect}
            onClearHistory={clearHistory}
            onToggleFavorite={toggleFavorite}
            onRemoveFromPhrasebook={removeFromPhrasebook}
            onAddCategory={addPhrasebookCategory}
            onUpdateCategory={updatePhrasebookCategory}
            onDeleteCategory={deletePhrasebookCategory}
            onMoveToCategory={moveToCategory}
            canAddToPhrasebook={canAddToPhrasebook}
            currentPlan={getCurrentPlan()}
            onSpeak={speak}
          />
        ) : activeTab === "flashcard" ? (
          <MobileFlashCard
            phrasebook={phrasebook}
            history={history}
            allLanguages={getOrderedLanguages()}
            phrasebookCategories={phrasebookCategories}
            onSpeak={speak}
          />
        ) : (
          <MobileSettings
            translationDirection={translationDirection}
            onTranslationDirectionChange={setTranslationDirection}
            enabledLanguages={enabledLanguages}
            onLanguageToggle={handleLanguageToggle}
            allLanguages={getOrderedLanguages()}
            languageOrder={languageOrder}
            onLanguageOrderChange={handleLanguageOrderChange}
            phrasebook={phrasebook}
            phrasebookCategories={phrasebookCategories}
            userSubscription={userSubscription}
            subscriptionPlans={subscriptionPlans}
            onUpgradeSubscription={upgradeSubscription}
            onCancelSubscription={cancelSubscription}
            onReactivateSubscription={reactivateSubscription}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}