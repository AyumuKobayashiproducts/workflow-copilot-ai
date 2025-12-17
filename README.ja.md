# Workflow Copilot AI（日本語）

[![CI](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml)

## クイックリンク

- デモ: `https://workflow-copilot-ai.vercel.app`
- リリース: `v1.0.0`（GitHub Releases）
- CI: GitHub Actions（`ci.yml`）
- ヘルスチェック: `GET /api/health`（DB疎通OKなら 200）
- ドキュメント一覧: `docs/INDEX.md`
- 英語README: `README.md`

## スクリーンショット（差し替え可）

![Home](docs/screenshots/home.png)
![Inbox](docs/screenshots/inbox.png)
![Weekly](docs/screenshots/weekly.png)

> 更新したい場合: `npm run screenshots`（`docs/screenshots/` に出力）

## 採用担当の方へ（評価ポイントと“証拠”の場所）

このリポジトリは「UIが動く」だけでなく、**実務で必要になりがちな運用・安全・再現性**まで含めて見られるように作っています。

- **品質ゲート（CIで毎回担保）**: `.github/workflows/ci.yml`（lint / i18n / build / E2E）
- **本番で危険フラグを止める**: `scripts/preflight-prod.mjs`（`AUTH_BYPASS` / `DEMO_TOOLS` / `E2E_TOKEN` をブロック）
- **E2Eを決定的にする仕組み**: `src/app/api/e2e/reset/route.ts`（本番404 + トークンガード）
- **DB疎通の“証明”**: `src/app/api/health/route.ts`（`GET /api/health`）
- **設計の全体像**: `docs/ARCHITECTURE.md`
- **運用チェックリスト**: `docs/RUNBOOK.md`
- **セキュリティ観点**: `docs/SECURITY.md`
- **E2Eの中身**: `tests/e2e/`（例: `tests/e2e/rbac-audit.spec.ts`）

## まず何を見ると早い？（5分の順番）

1. この `README.ja.md`（プロダクト/再現手順）
2. `docs/RECRUITER_NOTES.ja.md`（採用担当向けの要点）
3. `docs/ARCHITECTURE.md`（全体設計）
4. `docs/RUNBOOK.md`（運用の考え方）
5. `tests/e2e/`（動作の証拠）

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

---

## 動作確認（30秒）

1. `/`（Home）→ 画面遷移ができる
2. `/api/health` → `{"ok":true,"db":"ok"}` が返る（DB接続できている）
3. `/breakdown` → 目標入力 → ステップ生成 → Inboxへ保存
4. `/inbox` → タスク編集/完了
5. `/weekly` → Next step を1つ選択 → 週次メモ/レポートを保存

## ローカル開発（最小）

前提: Node.js / npm

```bash
npm install
```

### 1) Postgres を起動（Dockerがある場合）

```bash
npm run db:up
```

`.env.local` を作り、`docs/env.example` を参考に `DATABASE_URL` / `PRISMA_DATABASE_URL` を設定します。  
（例: Docker Compose の場合は `postgresql://postgres:postgres@localhost:5432/app?schema=public`）

### 2) マイグレーション & seed

```bash
npm run db:migrate
npm run db:seed
```

### 3) 起動

```bash
npm run dev
```

## E2E（Playwright）

E2Eは **Postgres必須**です（`DATABASE_URL` / `PRISMA_DATABASE_URL`）。

```bash
npm run test:e2e
```

`test:e2e` は実行前に preflight で環境を検査し、DBのenvが無い場合は分かりやすく停止します。

## 環境変数（要点）

`docs/env.example` に一覧があります。よく触るものだけ抜粋します。

- **DB（必須）**: `DATABASE_URL`, `PRISMA_DATABASE_URL`
- **認証（ローカルでログインを使う場合）**: `AUTH_SECRET`, `AUTH_URL`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- **Slack（任意）**: `SLACK_WEBHOOK_URL`
- **AI（任意）**: `OPENAI_API_KEY`（未設定でもBreakdownはテンプレで動作）

