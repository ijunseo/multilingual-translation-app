import { Alert, Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';

// Product IDs for iOS and Android
// iOS: App Store Connectで設定したProduct ID
// Android: Google Play Consoleで設定したProduct ID
export const PRODUCT_IDS = {
  basic_monthly: Platform.select({
    ios: 'com.myphrases.basic.monthly',
    android: 'basic_monthly',
    default: 'basic_monthly',
  })!,
  basic_yearly: Platform.select({
    ios: 'com.myphrases.basic.yearly',
    android: 'basic_yearly',
    default: 'basic_yearly',
  })!,
  premium_monthly: Platform.select({
    ios: 'com.myphrases.premium.monthly',
    android: 'premium_monthly',
    default: 'premium_monthly',
  })!,
  premium_yearly: Platform.select({
    ios: 'com.myphrases.premium.yearly',
    android: 'premium_yearly',
    default: 'premium_yearly',
  })!,
};

export interface IAPProduct {
  productId: string;
  price: string;
  priceAmountMicros?: number;
  currency?: string;
  title?: string;
  description?: string;
  subscriptionPeriod?: string;
}

export interface PurchaseInfo {
  productId: string;
  transactionId: string;
  purchaseTime: number;
  acknowledged: boolean;
}

/**
 * App内課金の初期化
 * アプリ起動時に必ず呼び出す必要があります
 */
export const initializeIAP = async (): Promise<boolean> => {
  try {
    await InAppPurchases.connectAsync();
    console.log('IAP initialized successfully');
    return true;
  } catch (error) {
    console.error('IAP initialization failed:', error);
    return false;
  }
};

/**
 * App内課金の接続を切断
 * アプリ終了時に呼び出すことを推奨
 */
export const disconnectIAP = async () => {
  try {
    await InAppPurchases.disconnectAsync();
    console.log('IAP disconnected');
  } catch (error) {
    console.error('Error disconnecting IAP:', error);
  }
};

/**
 * 利用可能な商品情報を取得
 */
export const getProducts = async (): Promise<InAppPurchases.IAPItemDetails[]> => {
  try {
    const productIds = Object.values(PRODUCT_IDS);
    const { results } = await InAppPurchases.getProductsAsync(productIds);
    return results || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

/**
 * 特定のプランとサイクルに対応する商品IDを取得
 */
export const getProductIdForPlan = (
  planId: 'basic' | 'premium',
  billingCycle: 'monthly' | 'yearly'
): string => {
  const key = `${planId}_${billingCycle}` as keyof typeof PRODUCT_IDS;
  return PRODUCT_IDS[key];
};

/**
 * 商品情報を取得
 */
export const getProductInfo = async (
  planId: 'basic' | 'premium',
  billingCycle: 'monthly' | 'yearly'
): Promise<InAppPurchases.IAPItemDetails | null> => {
  try {
    const productId = getProductIdForPlan(planId, billingCycle);
    const products = await getProducts();
    return products.find(p => p.productId === productId) || null;
  } catch (error) {
    console.error('Error getting product info:', error);
    return null;
  }
};

/**
 * サブスクリプションの購入
 */
export const purchaseSubscription = async (
  planId: 'basic' | 'premium',
  billingCycle: 'monthly' | 'yearly'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const productId = getProductIdForPlan(planId, billingCycle);

    // 購入処理を開始
    await InAppPurchases.purchaseItemAsync(productId);

    // 購入リスナーで結果を受け取るため、ここでは成功を返す
    console.log('Purchase initiated for:', productId);
    return { success: true };
  } catch (error: any) {
    console.error('Error during purchase:', error);

    // ユーザーキャンセルのチェック
    if (error?.code === 'E_USER_CANCELLED' || error?.message?.includes('user cancel')) {
      return { success: false, error: 'User cancelled the purchase' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * 過去の購入履歴を取得
 * アプリ起動時に呼び出して、サブスクリプションの状態を復元します
 */
export const getPurchaseHistory = async (): Promise<InAppPurchases.InAppPurchase[]> => {
  try {
    const { results } = await InAppPurchases.getPurchaseHistoryAsync();
    console.log('Purchase history:', results);
    return results || [];
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    return [];
  }
};

/**
 * サブスクリプションの復元
 * ユーザーが新しいデバイスでアプリを使用する際などに必要
 */
export const restorePurchases = async (): Promise<{
  success: boolean;
  purchases: InAppPurchases.InAppPurchase[]
}> => {
  try {
    const purchases = await getPurchaseHistory();

    if (purchases.length > 0) {
      // 未確認のトランザクションを確認
      for (const purchase of purchases) {
        if (!purchase.acknowledged) {
          await InAppPurchases.finishTransactionAsync(purchase, true);
        }
      }

      return { success: true, purchases };
    } else {
      return { success: false, purchases: [] };
    }
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { success: false, purchases: [] };
  }
};

/**
 * アクティブなサブスクリプションをチェック
 */
export const checkActiveSubscription = async (): Promise<{
  isActive: boolean;
  planId: 'free' | 'basic' | 'premium';
  expiresAt: Date | null;
}> => {
  try {
    const purchases = await getPurchaseHistory();

    // 最新の有効なサブスクリプションを探す
    let activePlan: 'free' | 'basic' | 'premium' = 'free';
    let expiresAt: Date | null = null;

    for (const purchase of purchases) {
      // acknowledged（確認済み）の購入のみをチェック
      if (purchase.acknowledged) {
        const productId = purchase.productId;

        // 商品IDから判定（実際のアプリではサーバー側で検証することを推奨）
        if (productId.includes('premium')) {
          activePlan = 'premium';
          // 有効期限の情報があれば設定
          // expo-in-app-purchasesでは自動更新サブスクリプションの有効期限を
          // 直接取得できないため、サーバー側での検証が推奨されます
          expiresAt = null; // サーバー側で管理
        } else if (productId.includes('basic') && activePlan !== 'premium') {
          activePlan = 'basic';
          expiresAt = null; // サーバー側で管理
        }
      }
    }

    return {
      isActive: activePlan !== 'free',
      planId: activePlan,
      expiresAt,
    };
  } catch (error) {
    console.error('Error checking active subscription:', error);
    return { isActive: false, planId: 'free', expiresAt: null };
  }
};

/**
 * サブスクリプションのキャンセル
 * 注意: App内課金では、キャンセルはストア（App Store/Google Play）で行う必要があります
 * このアプリから直接キャンセルすることはできません
 */
export const cancelSubscription = async (): Promise<void> => {
  const storeUrl = Platform.select({
    ios: 'https://apps.apple.com/account/subscriptions',
    android: 'https://play.google.com/store/account/subscriptions',
    default: '',
  });

  Alert.alert(
    'サブスクリプションのキャンセル',
    Platform.OS === 'ios'
      ? 'サブスクリプションをキャンセルするには、iPhoneの設定アプリから「Apple ID」→「サブスクリプション」を開いてください。'
      : 'サブスクリプションをキャンセルするには、Google Playストアアプリから「お支払いと定期購入」→「定期購入」を開いてください。',
    [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: Platform.OS === 'ios' ? '設定を開く' : 'ストアを開く',
        onPress: () => {
          // 設定アプリまたはストアアプリを開く
          // 注意: 実際の実装では、Linkingモジュールを使用してURLを開きます
          console.log('Open store:', storeUrl);
        },
      },
    ]
  );
};

/**
 * 価格情報の取得（フォールバック）
 * 商品情報が取得できない場合のデフォルト価格
 */
export const getDefaultPrice = (
  planId: 'basic' | 'premium',
  billingCycle: 'monthly' | 'yearly'
): number => {
  const prices = {
    basic: {
      monthly: 580,
      yearly: 6000,
    },
    premium: {
      monthly: 1800,
      yearly: 18000,
    },
  };

  return prices[planId][billingCycle];
};

/**
 * 購入リスナーを設定
 * 購入の状態変化を監視します
 */
export const setPurchaseListener = (
  callback: (purchase: InAppPurchases.InAppPurchase) => void
): { remove: () => void } => {
  InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
    console.log('Purchase listener called:', { responseCode, errorCode });

    if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
      results.forEach(purchase => {
        console.log('Purchase received:', purchase);

        // トランザクションを確認
        InAppPurchases.finishTransactionAsync(purchase, true)
          .then(() => {
            console.log('Transaction finished');
            callback(purchase);
          })
          .catch(error => {
            console.error('Error finishing transaction:', error);
          });
      });
    } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      console.log('User canceled the purchase');
    } else if (errorCode) {
      console.error('Purchase error:', errorCode);
    }
  });

  // リスナーを解除する関数を返す
  return {
    remove: () => {
      InAppPurchases.setPurchaseListener(null);
    },
  };
};
