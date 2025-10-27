import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, StatusBar, SafeAreaView, TouchableWithoutFeedback, Keyboard, Alert, Platform, Linking } from "react-native";
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as Device from 'expo-device';
import { MobileSourceLanguageSelector } from "./src/components/MobileSourceLanguageSelector";
import { MobileToneSelector } from "./src/components/MobileToneSelector";
import { MobileTranslationInput } from "./src/components/MobileTranslationInput";
import { MultiTranslationOutput } from "./src/components/MultiTranslationOutput";
import { MobileHistoryWithPhrasebook } from "./src/components/MobileHistoryWithPhrasebook";
import { MobileSettings, TranslationDirection } from "./src/components/MobileSettings";
import { MobileFlashCard } from "./src/components/MobileFlashCard";
import { BottomNavigation } from "./src/components/BottomNavigation";
import { translationService } from "./src/services/translation";
import { initializeIAP, disconnectIAP, checkActiveSubscription, setPurchaseListener } from "./src/services/iap";
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface UserSubscription {
  planId: 'free' | 'basic' | 'premium';
  isActive: boolean;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  willCancelAt: Date | null;
}

const languages: Language[] = [
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh-cn", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "zh-tw", name: "Chinese (Traditional)", nativeName: "繁體中文" },
  { code: "en-us", name: "English (US)", nativeName: "English (US)" },
  { code: "en-uk", name: "English (UK)", nativeName: "English (UK)" },
  { code: "en-au", name: "English (Australia)", nativeName: "English (Australia)" },
];

const translationTones: TranslationTone[] = [
  { id: "casual", name: "Casual", description: "Relaxed and friendly", icon: "" },
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
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>(["ja", "ko", "zh-cn", "zh-tw", "en-us", "en-uk", "en-au"]);
  const [languageOrder, setLanguageOrder] = useState<string[]>(["ja", "ko", "zh-cn", "zh-tw", "en-us", "en-uk", "en-au"]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription>({
    planId: 'free',
    isActive: true,
    expiresAt: null,
    cancelledAt: null,
    willCancelAt: null,
  });
  const [selectedTone, setSelectedTone] = useState<string>("casual");
  const [isListening, setIsListening] = useState(false);
  const [recognitionPermission, setRecognitionPermission] = useState<boolean | null>(null);

  // App内課金の初期化
  useEffect(() => {
    const initializeApp = async () => {
      // IAP初期化
      const iapInitialized = await initializeIAP();
      if (iapInitialized) {
        console.log('IAP initialized successfully');

        // サブスクリプションの状態をチェック
        const subscriptionStatus = await checkActiveSubscription();
        if (subscriptionStatus.isActive) {
          setUserSubscription({
            planId: subscriptionStatus.planId,
            isActive: true,
            expiresAt: subscriptionStatus.expiresAt,
            cancelledAt: null,
            willCancelAt: null,
          });
          console.log('Active subscription found:', subscriptionStatus.planId);
        }

        // 購入リスナーを設定
        const listener = setPurchaseListener(async (purchase) => {
          console.log('Purchase listener triggered:', purchase);

          // サブスクリプションの状態を再チェック
          const newStatus = await checkActiveSubscription();
          if (newStatus.isActive) {
            setUserSubscription({
              planId: newStatus.planId,
              isActive: true,
              expiresAt: newStatus.expiresAt,
              cancelledAt: null,
              willCancelAt: null,
            });
          }
        });

        // クリーンアップ
        return () => {
          listener.remove();
        };
      } else {
        console.warn('IAP initialization failed');
      }
    };

    initializeApp();

    // アプリ終了時のクリーンアップ
    return () => {
      disconnectIAP();
    };
  }, []);

  // マイク権限の初期化と詳細チェック
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          console.log('Initializing permissions for mobile device...');

          // 音声録音権限をリクエスト
          const audioPermissions = await Audio.requestPermissionsAsync();
          console.log('Audio permission status:', audioPermissions.status);

          if (audioPermissions.status === 'granted') {
            setRecognitionPermission(true);
            console.log('Audio permission granted');
          } else {
            setRecognitionPermission(false);
            console.log('Audio permission denied or not determined');
          }
        } else {
          // Web環境
          if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            setRecognitionPermission(true);
          } else {
            setRecognitionPermission(false);
          }
        }
      } catch (error) {
        console.error('Permission initialization error:', error);
        setRecognitionPermission(false);
      }
    };

    initializePermissions();
  }, []);


  const getOrderedLanguages = useCallback((): Language[] => {
    const orderedLangs: Language[] = [];

    languageOrder.forEach(langCode => {
      const lang = languages.find(l => l.code === langCode);
      if (lang) {
        orderedLangs.push(lang);
      }
    });

    languages.forEach(lang => {
      if (!orderedLangs.find(l => l.code === lang.code)) {
        orderedLangs.push(lang);
      }
    });

    return orderedLangs;
  }, [languageOrder]);

  const getTargetLanguages = useCallback((sourceLang: Language): Language[] => {
    return getOrderedLanguages().filter(lang => lang.code !== sourceLang.code);
  }, [getOrderedLanguages]);

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
      await new Promise(resolve => setTimeout(resolve, 800));

      const allTargetLangs = getTargetLanguages(sourceLanguage);
      const allTargetCodes = allTargetLangs.map(lang => lang.code);
      const results = await mockMultiTranslate(sourceText, sourceLanguage.code, allTargetCodes, selectedTone);

      setTranslations(results);

      const historyItem: MultiTranslationHistoryItem = {
        id: Date.now().toString(),
        sourceText,
        translations: results,
        sourceLanguage: sourceLanguage.code,
        timestamp: new Date(),
        tone: selectedTone,
      };

      setHistory(prev => [historyItem, ...prev.slice(0, 19)]);
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

      if (newEnabled.length < 2) {
        return prev;
      }

      return newEnabled;
    });
  };

  const handleLanguageOrderChange = (newOrder: string[]) => {
    setLanguageOrder(newOrder);
  };

  useEffect(() => {
    if (!enabledLanguages.includes(sourceLanguage.code)) {
      const firstEnabledLang = getOrderedLanguages().find(lang => enabledLanguages.includes(lang.code));
      if (firstEnabledLang) {
        setSourceLanguage(firstEnabledLang);
        setSourceText("");
        setTranslations({});
      }
    }
  }, [enabledLanguages, sourceLanguage.code, getOrderedLanguages]);

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

  const handleHistorySelect = (item: MultiTranslationHistoryItem) => {
    const sourceLang = getOrderedLanguages().find(lang => lang.code === item.sourceLanguage);

    if (sourceLang) {
      setSourceLanguage(sourceLang);
      setSourceText(item.sourceText);
      setTranslations(item.translations);
      setActiveTab("translate");
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const checkSubscriptionStatus = () => {
    const now = new Date();

    if (userSubscription.willCancelAt && now >= userSubscription.willCancelAt) {
      setUserSubscription({
        planId: 'free',
        isActive: true,
        expiresAt: null,
        cancelledAt: userSubscription.cancelledAt,
        willCancelAt: null,
      });

      handlePhrasebookDowngrade('free');
      return;
    }

    if (userSubscription.expiresAt && now >= userSubscription.expiresAt && !userSubscription.willCancelAt) {
      setUserSubscription(prev => ({
        planId: 'free',
        isActive: true,
        expiresAt: null,
        cancelledAt: now,
        willCancelAt: null,
      }));

      handlePhrasebookDowngrade('free');
    }
  };

  const handlePhrasebookDowngrade = (newPlanId: 'free' | 'basic' | 'premium') => {
    const newPlan = subscriptionPlans.find(plan => plan.id === newPlanId);
    if (!newPlan) return;

    if (phrasebook.length > newPlan.phrasebookLimit) {
      setPhrasebook(prev => prev.slice(0, newPlan.phrasebookLimit));
    }
  };

  const getCurrentPlan = () => {
    return subscriptionPlans.find(plan => plan.id === userSubscription.planId) || subscriptionPlans[0];
  };

  const canAddToPhrasebook = () => {
    const currentPlan = getCurrentPlan();
    return phrasebook.length < currentPlan.phrasebookLimit;
  };

  const toggleFavorite = (item: MultiTranslationHistoryItem, categoryId?: string) => {
    setPhrasebook(prev => {
      const exists = prev.find(p => p.id === item.id);
      if (exists) {
        return prev.filter(p => p.id !== item.id);
      } else {
        const currentPlan = getCurrentPlan();
        if (prev.length >= currentPlan.phrasebookLimit) {
          return prev;
        }

        const itemWithCategory = {
          ...item,
          category: categoryId || "general"
        };
        return [itemWithCategory, ...prev];
      }
    });
  };

  const saveCurrentTranslation = () => {
    if (!sourceText.trim() || Object.keys(translations).length === 0) {
      return;
    }

    if (!canAddToPhrasebook()) {
      Alert.alert(
        "Phrasebook Limit Reached",
        `Phrasebook limit reached (${getCurrentPlan().phrasebookLimit} phrases). Upgrade to add more.`
      );
      return;
    }

    const newItem: MultiTranslationHistoryItem = {
      id: Date.now().toString(),
      sourceText,
      translations,
      sourceLanguage: sourceLanguage.code,
      timestamp: new Date(),
      tone: selectedTone,
      category: "general"
    };

    setPhrasebook(prev => [newItem, ...prev]);
    Alert.alert("Success", "Translation saved to phrasebook!");
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
    if (id === "general") return;

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
    const newSubscription: UserSubscription = {
      planId,
      isActive: true,
      expiresAt: billingCycle === 'monthly'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      cancelledAt: null,
      willCancelAt: null,
    };
    setUserSubscription(newSubscription);
  };

  const cancelSubscription = (immediate: boolean = false) => {
    if (userSubscription.planId === 'free') return;

    const now = new Date();

    if (immediate) {
      setUserSubscription({
        planId: 'free',
        isActive: true,
        expiresAt: null,
        cancelledAt: now,
        willCancelAt: null,
      });

      handlePhrasebookDowngrade('free');
    } else {
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

  const handleVoiceInput = async () => {
    if (recognitionPermission === null) {
      Alert.alert('音声認識', '音声認識の初期化中です。少しお待ちください。');
      return;
    }

    if (recognitionPermission === false) {
      Alert.alert(
        '🎤 マイク権限が必要です',
        '音声認識機能を使用するには、マイク権限を許可してください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '権限を再取得',
            onPress: async () => {
              console.log('Requesting audio permissions...');
              const { status, canAskAgain } = await Audio.requestPermissionsAsync();
              console.log('Permission result:', { status, canAskAgain });

              if (status === 'granted') {
                setRecognitionPermission(true);
                Alert.alert('✅ 権限が許可されました', 'マイクボタンをタップして音声認識をお試しください！');
              } else if (!canAskAgain) {
                // 権限が永続的に拒否された場合
                Alert.alert(
                  '⚙️ 設定で権限を有効にしてください',
                  `アプリの設定でマイク権限を有効にしてください：\n\n${Platform.OS === 'ios' ?
                    '設定 > プライバシーとセキュリティ > マイク > このアプリ' :
                    '設定 > アプリ > このアプリ > 権限 > マイク'
                  }`,
                  [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                      text: '設定を開く',
                      onPress: () => {
                        if (Platform.OS === 'ios') {
                          Linking.openURL('app-settings:');
                        } else {
                          Linking.openSettings();
                        }
                      }
                    }
                  ]
                );
              } else {
                Alert.alert(
                  '📱 代替手段をご利用ください',
                  Platform.OS === 'ios' ?
                    'キーボードのマイクボタンをタップして音声入力をご利用ください。\n\n設定 > 一般 > キーボード > 音声入力を有効にしてください。' :
                    'キーボードのマイクボタンをタップして音声入力をご利用ください。'
                );
              }
            }
          }
        ]
      );
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // Web環境での音声認識
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

          if (isListening) {
            setIsListening(false);
            return;
          }

          const recognition = new SpeechRecognition();
          const locale = sourceLanguage.code === 'ja' ? 'ja-JP' :
                        sourceLanguage.code === 'ko' ? 'ko-KR' :
                        sourceLanguage.code === 'zh-cn' ? 'zh-CN' :
                        sourceLanguage.code === 'zh-tw' ? 'zh-TW' :
                        sourceLanguage.code === 'en-us' ? 'en-US' :
                        sourceLanguage.code === 'en-uk' ? 'en-GB' :
                        sourceLanguage.code === 'en-au' ? 'en-AU' : 'en-US';

          recognition.lang = locale;
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;
          recognition.continuous = false;

          recognition.onstart = () => setIsListening(true);
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSourceText(transcript);
            setIsListening(false);
          };
          recognition.onerror = (event: any) => {
            setIsListening(false);
            Alert.alert('音声認識エラー', '音声認識に失敗しました');
          };
          recognition.onend = () => setIsListening(false);

          recognition.start();
          Alert.alert('音声認識', `${sourceLanguage.nativeName}で話してください...`);
        }
      } else {
        // iOS/Android: 権限が許可されている場合
        Alert.alert(
          '🎤 音声認識機能について',
          `マイク権限は許可されていますが、現在Expoアプリでの音声認識には制限があります。\n\n代替手段として以下をご利用ください：\n\n📱 キーボードのマイクボタン\n${Platform.OS === 'ios' ?
            '⚙️ 設定 > 一般 > キーボード > 音声入力\n🎤 Siriディクテーション（長押し）' :
            '🎤 Googleアシスタントの音声入力'
          }`,
          [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: 'キーボード音声入力を使用',
              style: 'default',
              onPress: () => {
                Alert.alert(
                  '📝 使用方法',
                  'テキスト入力フィールドをタップしてキーボードを表示し、マイクボタンをタップしてください。'
                );
              }
            }
          ]
        );
      }
    } catch (error) {
      setIsListening(false);
      console.error('Voice input error:', error);
      Alert.alert('音声認識エラー', '音声認識の操作に失敗しました');
    }
  };

  const handleSpeak = async (text: string, language?: string) => {
    if (!text.trim()) return;

    try {
      // まず現在再生中の音声を停止
      await Speech.stop();

      // 言語コードをexpo-speechで使用できる形式に変換
      const speechLang = language === 'ja' ? 'ja' :
                        language === 'ko' ? 'ko' :
                        language === 'zh-cn' ? 'zh-CN' :
                        language === 'zh-tw' ? 'zh-TW' :
                        language === 'en-us' ? 'en-US' :
                        language === 'en-uk' ? 'en-GB' :
                        language === 'en-au' ? 'en-AU' : 'en-US';

      const options = {
        language: speechLang,
        pitch: 1.0,
        rate: 0.75, // iOS向けに少し遅めに調整
        quality: Speech.VoiceQuality.Enhanced,
      };

      await Speech.speak(text, options);
    } catch (error) {
      console.error('Speech error:', error);
      Alert.alert('音声読み上げエラー', '音声の再生に失敗しました');
    }
  };

  const getPlaceholder = (lang: Language) => {
    const placeholders = {
      ja: "翻訳したいテキストを入力してください",
      ko: "번역할 텍스트를 입력하세요",
      "zh-cn": "请输入要翻译的文本",
      "zh-tw": "請輸入要翻譯的文本",
      "en-us": "Enter text to translate",
      "en-uk": "Enter text to translate",
      "en-au": "Enter text to translate",
    };
    return placeholders[lang.code as keyof typeof placeholders] || "Enter text to translate";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Phrases</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        {activeTab === "translate" ? (
          <View style={styles.translateTab}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.inputArea}>
                <View style={styles.languageSection}>
                  <MobileSourceLanguageSelector
                    languages={getOrderedLanguages()}
                    sourceLanguage={sourceLanguage}
                    onSourceLanguageChange={setSourceLanguage}
                    translationDirection={translationDirection}
                  />
                </View>

                <View style={styles.toneSection}>
                  <MobileToneSelector
                    tones={translationTones}
                    selectedTone={selectedTone}
                    onToneChange={setSelectedTone}
                  />
                </View>

                <View style={styles.inputSection}>
                  <MobileTranslationInput
                    value={sourceText}
                    onChange={setSourceText}
                    placeholder={getPlaceholder(sourceLanguage)}
                    onVoiceInput={handleVoiceInput}
                    onSpeak={handleSpeak}
                    isLoading={isLoading}
                    isListening={isListening}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>

            <View style={styles.outputSection}>
              <MultiTranslationOutput
                sourceText={sourceText}
                sourceLanguage={sourceLanguage}
                translations={translations}
                targetLanguages={getFilteredTargetLanguages(sourceLanguage)}
                isLoading={isLoading}
                onSpeak={handleSpeak}
                onSave={saveCurrentTranslation}
                canSave={canAddToPhrasebook()}
              />
            </View>
          </View>
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
            onSpeak={handleSpeak}
          />
        ) : activeTab === "flashcard" ? (
          <MobileFlashCard
            phrasebook={phrasebook}
            history={history}
            allLanguages={getOrderedLanguages()}
            phrasebookCategories={phrasebookCategories}
            onSpeak={handleSpeak}
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
      </View>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  mainContent: {
    flex: 1,
    paddingBottom: 90,
  },
  translateTab: {
    flex: 1,
  },
  inputArea: {
    // Empty style - just a container for TouchableWithoutFeedback
  },
  languageSection: {
    paddingVertical: 8,
  },
  toneSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  outputSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
    minHeight: 300,
    maxHeight: 500,
  },
});