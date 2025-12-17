# Workflow Copilot AI（日本語）

[![CI](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml)

## 1. プロダクト概要（3行以内）

タスクが溜まりがちな開発・業務で「次に何をやるか」を決めやすくする、個人〜小規模チーム向けの実行支援アプリです。  
Inboxで集め、Breakdownで“次の一歩”に落とし、Weeklyで振り返ってNext stepを1つに絞る流れを支援します。  
デモ: `https://workflow-copilot-ai.vercel.app`（DB疎通の確認: `GET /api/health`）

## 2. 解決する課題

- **タスクが受信箱に溜まって終わる**: 収集はできるが、分解・実行に移れない
- **週次レビューが“振り返りだけ”で終わる**: 次の行動に繋がらない
- **共有が重い**: 週報を作る/整形する/投稿するのが面倒で継続しにくい

## 3. 主な機能（箇条書き）

- **Inbox**: タスクの追加 / 編集 / 完了切替 / 削除
- **Breakdown**: 目標を入力し、実行ステップ案を生成してInboxへ一括保存
- **Weekly**: 週次のメモ/レポートを生成・保存し、Next step（1件）を選択
- **Slack共有（任意）**: 週報をIncoming Webhookで投稿
- **ログイン**: GitHub OAuth（ログイン必須の画面を保護）

## 4. 想定ユースケース

- **個人の開発タスク整理**: 思いついたタスクをInboxに集め、週次でNext stepを1つ決めて迷いを減らす
- **小さなチームの週報共有**: 週報をアプリで作成し、Slackに投稿して非同期の共有を軽くする
- **個人開発の運用練習**: DBあり・E2Eあり・CIありの構成で「動くことの証拠」を残す

## 5. 技術スタック

- **フロント/サーバ**: Next.js（App Router）, TypeScript
- **認証**: Auth.js / NextAuth v5（GitHub OAuth）
- **DB/ORM**: PostgreSQL, Prisma
- **AI（任意）**: OpenAI API（`OPENAI_API_KEY` がある場合のみステップ生成に利用。未設定時はテンプレのフォールバック）
- **E2E**: Playwright
- **CI**: GitHub Actions
- **その他**: Slack Incoming Webhook（任意）, Sentry（任意）

## 6. 開発の工夫・設計方針

- **要件を小さく切って前進**: まずInbox/Weeklyの最小ループを作り、Breakdownや共有を段階的に追加
- **AIは“補助”**: ステップ生成は提案に留め、最終的な判断・編集はユーザーが行う前提
- **実務で困りがちなところを先に潰す**:
  - DB/E2Eの前提が崩れたときに迷わないよう、E2E実行前に環境チェック（preflight）を実施
  - CIで `lint / i18nキー整合 / build / E2E` まで回し、再現性を優先
  - `/api/health` で「アプリ＋DBが生きている」ことを短い手順で確認可能

## 7. 今後の拡張予定（簡潔でOK）

- 設定画面からのデータ削除（タスク/週次/アカウント）
- 書き込み系エンドポイントの基本的なレート制限・悪用対策
- オンボーディング改善（初回体験のガイド、サンプルデータの扱い）


