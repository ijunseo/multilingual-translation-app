import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getProductInfo, purchaseSubscription, getDefaultPrice } from '../services/iap';

interface IAPPaymentProps {
  planId: 'basic' | 'premium';
  billingCycle: 'monthly' | 'yearly';
  onSuccess: () => void;
  onCancel: () => void;
}

export function IAPPayment({
  planId,
  billingCycle,
  onSuccess,
  onCancel,
}: IAPPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [productPrice, setProductPrice] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(true);

  useEffect(() => {
    loadProductInfo();
  }, [planId, billingCycle]);

  const loadProductInfo = async () => {
    setProductLoading(true);
    try {
      const product = await getProductInfo(planId, billingCycle);
      if (product) {
        setProductPrice(product.price);
      } else {
        // フォールバック: デフォルト価格を使用
        const defaultPrice = getDefaultPrice(planId, billingCycle);
        setProductPrice(`¥${defaultPrice.toLocaleString()}`);
      }
    } catch (error) {
      console.error('Error loading product info:', error);
      // エラー時もデフォルト価格を表示
      const defaultPrice = getDefaultPrice(planId, billingCycle);
      setProductPrice(`¥${defaultPrice.toLocaleString()}`);
    } finally {
      setProductLoading(false);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);

    try {
      // 開発環境のテストモード
      const isDevelopmentMode = __DEV__;

      if (isDevelopmentMode) {
        // テストモード：実際の課金をスキップ
        Alert.alert(
          '🚧 開発モード',
          'App内課金のテストを行うには、実機でのテストまたはTestFlightが必要です。\n\n実際の課金フローを確認するには：\n\n1. App Store ConnectまたはGoogle Play Consoleでサブスクリプション商品を設定\n2. Expo development buildを作成\n3. 実機またはTestFlightでテスト\n\nとりあえずUIフローを確認しますか？',
          [
            { text: 'キャンセル', style: 'cancel', onPress: () => setLoading(false) },
            {
              text: '続行（テスト）',
              onPress: () => {
                Alert.alert(
                  '✅ サブスクリプション開始（テスト）',
                  `${planId === 'basic' ? 'Basic' : 'Premium'}プランへのアップグレードが完了しました！\n\n※これはテストモードです。実際の課金は発生していません。`,
                  [{ text: 'OK', onPress: onSuccess }]
                );
                setLoading(false);
              },
            },
          ]
        );
        return;
      }

      // 本番モード：実際のApp内課金
      const result = await purchaseSubscription(planId, billingCycle);

      if (result.success) {
        // 購入成功
        Alert.alert(
          '✅ サブスクリプション開始',
          `${planId === 'basic' ? 'Basic' : 'Premium'}プランへのアップグレードが完了しました！\n\nありがとうございます。`,
          [
            {
              text: 'OK',
              onPress: onSuccess,
            },
          ]
        );
      } else {
        // 購入失敗
        if (result.error === 'User cancelled the purchase') {
          // ユーザーがキャンセル
          Alert.alert('キャンセル', 'サブスクリプションの購入がキャンセルされました');
        } else if (result.error === 'Purchase is pending approval') {
          // 承認待ち
          Alert.alert(
            '承認待ち',
            'サブスクリプションの購入は承認待ちです。承認され次第、プランがアップグレードされます。'
          );
        } else {
          // その他のエラー
          console.error('Purchase error:', result.error);
          Alert.alert('エラー', `サブスクリプションの購入に失敗しました: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('エラー', 'サブスクリプションの購入処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const getPlanName = () => {
    return planId === 'basic' ? 'Basic' : 'Premium';
  };

  const getBillingCycleName = () => {
    return billingCycle === 'monthly' ? '月額プラン' : '年額プラン';
  };

  const getFeatures = () => {
    if (planId === 'basic') {
      return ['30個のフレーズを保存', 'PDF エクスポート'];
    } else {
      return ['2000個のフレーズを保存', 'PDF エクスポート', '優先サポート'];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>サブスクリプション</Text>

        <View style={styles.planInfo}>
          <Text style={styles.planName}>{getPlanName()} プラン</Text>
          <Text style={styles.billingCycle}>{getBillingCycleName()}</Text>
        </View>

        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>お支払い金額</Text>
          {productLoading ? (
            <ActivityIndicator size="small" color="#030213" />
          ) : (
            <>
              <Text style={styles.price}>{productPrice || '読み込み中...'}</Text>
              <Text style={styles.pricePeriod}>
                / {billingCycle === 'monthly' ? '月' : '年'}
              </Text>
            </>
          )}
        </View>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>プランに含まれる内容:</Text>
          {getFeatures().map((feature, index) => (
            <View key={index} style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.autoRenewal}>
          <Text style={styles.autoRenewalTitle}>🔄 自動更新サブスクリプション</Text>
          <Text style={styles.autoRenewalText}>
            サブスクリプションは自動的に更新されます。キャンセルはいつでも可能です。
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
            onPress={handlePurchase}
            disabled={loading || productLoading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonTextPrimary}>サブスクリプションを開始</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.buttonTextSecondary}>キャンセル</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          {__DEV__
            ? '⚠️ 開発モード：実際の課金は発生しません'
            : 'App Store/Google Playの安全な決済システムを使用しています'}
        </Text>

        <Text style={styles.termsText}>
          サブスクリプションを開始することで、利用規約とプライバシーポリシーに同意したものとみなされます。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 20,
    textAlign: 'center',
  },
  planInfo: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4,
  },
  billingCycle: {
    fontSize: 14,
    color: '#666666',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 40,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: '#030213',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 4,
  },
  features: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#030213',
    marginBottom: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
  },
  autoRenewal: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
  },
  autoRenewalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  autoRenewalText: {
    fontSize: 12,
    color: '#0c4a6e',
    lineHeight: 18,
  },
  buttons: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: '#030213',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#030213',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonTextPrimary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#030213',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 14,
  },
});
