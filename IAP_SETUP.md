# App内課金（In-App Purchase）セットアップガイド

このアプリは、StripeからApple App StoreとGoogle Play Storeのネイティブなサブスクリプション課金（App内課金）に移行しました。

## 📋 概要

### 変更点
- ✅ **Stripe決済** → **App内課金（IAP）**に移行
- ✅ 自動更新サブスクリプションをサポート
- ✅ App StoreとGoogle Playの統合された課金システムを使用
- ✅ サブスクリプションの管理がストアアプリから可能

### メリット
- ユーザーがストアアカウントで一元管理できる
- 自動更新が組み込まれている
- セキュアで信頼性の高い決済
- バックエンドサーバーが不要（基本的な実装の場合）

## 🚀 セットアップ手順

### 1. iOS（App Store Connect）でのセットアップ

#### 1.1 App Store Connectにサインイン
https://appstoreconnect.apple.com/

#### 1.2 アプリを作成
1. 「マイApp」→「+」→「新規App」
2. プラットフォーム: iOS
3. Bundle ID: `com.myphrases.app`（app.jsonで設定済み）
4. アプリ名とその他の情報を入力

#### 1.3 サブスクリプショングループを作成
1. アプリを選択 → 「サブスクリプション」タブ
2. 「+」→「サブスクリプショングループを作成」
3. グループ名: 例) "Premium Subscriptions"

#### 1.4 サブスクリプション商品を追加

以下の4つの商品を作成します：

**Basic Monthly（月額Basic）**
- Product ID: `com.myphrases.basic.monthly`
- 価格: ¥580/月
- サブスクリプション期間: 1ヶ月

**Basic Yearly（年額Basic）**
- Product ID: `com.myphrases.basic.yearly`
- 価格: ¥6,000/年
- サブスクリプション期間: 1年

**Premium Monthly（月額Premium）**
- Product ID: `com.myphrases.premium.monthly`
- 価格: ¥1,800/月
- サブスクリプション期間: 1ヶ月

**Premium Yearly（年額Premium）**
- Product ID: `com.myphrases.premium.yearly`
- 価格: ¥18,000/年
- サブスクリプション期間: 1年

#### 1.5 各商品の詳細を設定
- サブスクリプション表示名（日本語・英語）
- 説明文
- レビュー用のスクリーンショット（オプション）

#### 1.6 税務・銀行情報の設定
「契約、税金、および銀行情報」から必要な情報を入力

### 2. Android（Google Play Console）でのセットアップ

#### 2.1 Google Play Consoleにアクセス
https://play.google.com/console/

#### 2.2 アプリを作成
1. 「アプリを作成」
2. アプリ名、デフォルト言語、アプリタイプを設定
3. Package name: `com.myphrases.app`（app.jsonで設定済み）

#### 2.3 サブスクリプション商品を作成
1. アプリを選択 → 「収益化」→「定期購入」
2. 「定期購入を作成」

以下の4つの商品を作成します：

**Basic Monthly**
- Product ID: `basic_monthly`
- 名前: Basic Monthly Plan
- 価格: ¥580/月
- 請求期間: 1ヶ月

**Basic Yearly**
- Product ID: `basic_yearly`
- 名前: Basic Yearly Plan
- 価格: ¥6,000/年
- 請求期間: 1年

**Premium Monthly**
- Product ID: `premium_monthly`
- 名前: Premium Monthly Plan
- 価格: ¥1,800/月
- 請求期間: 1ヶ月

**Premium Yearly**
- Product ID: `premium_yearly`
- 名前: Premium Yearly Plan
- 価格: ¥18,000/年
- 請求期間: 1年

#### 2.4 各商品の詳細を設定
- タイトル（日本語・英語）
- 説明文
- 無料トライアル期間（オプション）

### 3. アプリのビルドと設定

#### 3.1 Development Buildの作成

Expo Go では App内課金をテストできないため、Development Build が必要です：

```bash
# EAS CLIをインストール（まだの場合）
npm install -g eas-cli

# EAS にログイン
eas login

# プロジェクトを設定
eas build:configure

# iOSのDevelopment Buildを作成
eas build --profile development --platform ios

# Androidのdevelopment Buildを作成
eas build --profile development --platform android
```

#### 3.2 実機でのテスト

**iOS:**
1. App Store ConnectでSandboxテスターアカウントを作成
2. 端末の設定 → App Store → サンドボックスアカウントでサインイン
3. Development Buildをインストールしてテスト

**Android:**
1. Google Play Consoleでライセンステスター（テストアカウント）を追加
2. Internal testingまたはClosed testingトラックにアプリをアップロード
3. テスターアカウントでテスト

## 🔧 開発時の注意点

### テストモード
開発環境（`__DEV__`がtrue）では、実際の課金は実行されず、テストモードで動作します。

### 本番モード
本番ビルド（`__DEV__`がfalse）では、実際のApp内課金が実行されます。

### サーバー側の検証（推奨）

セキュリティを強化するため、サーバー側でレシート検証を実装することを強く推奨します：

**iOS:**
- Apple のレシート検証API を使用
- https://developer.apple.com/documentation/appstorereceipts/verifyreceipt

**Android:**
- Google Play Developer API を使用
- https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions

## 📱 ユーザーフロー

### 1. サブスクリプション購入
1. 設定画面で「Subscription」タブを開く
2. プラン（Basic/Premium）と課金サイクル（月額/年額）を選択
3. 「サブスクリプションを開始」をタップ
4. App Store/Google Playの決済画面で確認
5. 購入完了

### 2. サブスクリプション管理
- **iOS**: 設定 → Apple ID → サブスクリプション
- **Android**: Google Play → お支払いと定期購入 → 定期購入

### 3. サブスクリプションキャンセル
アプリからは直接キャンセルできません。ストアアプリから管理します。

## 🎯 プランの詳細

### Free（無料）
- フレーズ保存: 10個まで
- PDF エクスポート: ❌

### Basic
- **月額**: ¥580
- **年額**: ¥6,000（¥960お得）
- フレーズ保存: 30個まで
- PDF エクスポート: ✅

### Premium
- **月額**: ¥1,800
- **年額**: ¥18,000（¥3,600お得）
- フレーズ保存: 2000個まで
- PDF エクスポート: ✅

## 🐛 トラブルシューティング

### 商品が取得できない
- Product IDが正しく設定されているか確認
- App Store Connect/Google Play Consoleで商品が承認済みか確認
- Bundle ID/Package nameが一致しているか確認

### 購入がキャンセルされる
- サンドボックス/テストアカウントでログインしているか確認
- 銀行・税務情報が設定されているか確認

### サブスクリプションが復元されない
- `getPurchaseHistory()`が正しく呼ばれているか確認
- サーバー側の検証を実装している場合は、そちらも確認

## 📚 参考リンク

- [Expo In-App Purchases ドキュメント](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [App Store Connect ヘルプ](https://help.apple.com/app-store-connect/)
- [Google Play Console ヘルプ](https://support.google.com/googleplay/android-developer/)
- [元記事（Zenn）](https://zenn.dev/moutend/articles/10111adb25d877)

## 🔒 セキュリティのベストプラクティス

1. **レシート検証をサーバー側で実装**
   - クライアント側だけの検証は脆弱
   - Apple/Googleのレシート検証APIを使用

2. **サブスクリプションの状態をサーバーで管理**
   - 有効期限の追跡
   - 不正な購入の検出

3. **定期的な同期**
   - アプリ起動時にサブスクリプション状態を確認
   - サーバー側で定期的に状態を更新

## ✅ 完了チェックリスト

### iOS
- [ ] App Store Connectでアプリを作成
- [ ] サブスクリプショングループを作成
- [ ] 4つのサブスクリプション商品を作成
- [ ] 税務・銀行情報を設定
- [ ] Sandboxテスターを作成
- [ ] Development Buildでテスト

### Android
- [ ] Google Play Consoleでアプリを作成
- [ ] 4つのサブスクリプション商品を作成
- [ ] ライセンステスターを追加
- [ ] Internal testingトラックにアップロード
- [ ] テストアカウントでテスト

### 本番リリース
- [ ] サーバー側のレシート検証を実装（推奨）
- [ ] プロダクションビルドを作成
- [ ] App Store/Google Playに提出
- [ ] 利用規約・プライバシーポリシーを準備

## 💡 Tips

- **無料トライアル**: App Store Connect/Google Play Consoleから設定可能
- **プロモーションコード**: ストアから生成可能
- **Small Business Program**: Appleの場合、年間売上$100万以下なら手数料15%（通常30%）
