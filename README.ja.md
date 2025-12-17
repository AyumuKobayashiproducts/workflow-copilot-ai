# Workflow Copilot AI（日本語）

[![CI](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml)

## クイックリンク

- **デモ**: [workflow-copilot-ai.vercel.app](https://workflow-copilot-ai.vercel.app/)
- **リリース**: [v1.0.0](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/releases/tag/v1.0.0)
- **CI**: [Actions（ci.yml）](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml)
- **ヘルスチェック**: `GET /api/health`（DB疎通OKなら 200）→ [`/api/health`](https://workflow-copilot-ai.vercel.app/api/health)
- **ドキュメント一覧**: [`docs/INDEX.md`](docs/INDEX.md)
- **採用担当向けメモ**: [`docs/RECRUITER_NOTES.ja.md`](docs/RECRUITER_NOTES.ja.md)
- **英語README**: [`README.md`](README.md)

## スクリーンショット（差し替え可）

![Home](docs/screenshots/home.png)
![Inbox](docs/screenshots/inbox.png)
![Weekly](docs/screenshots/weekly.png)

> 更新したい場合: `npm run screenshots`（`docs/screenshots/` に出力）

## 画面の用語（最初にここだけ）

- **受信箱（Inbox）**: 思いついたタスクを集める場所
- **分解（Breakdown）**: 目標を実行ステップ案に落とす場所
- **週間（Weekly）**: 週次で振り返り、**Next step（次の一手）を1つ**決める場所

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
受信箱で集め、分解で“次の一歩”に落とし、週間で振り返ってNext stepを1つに絞る流れを支援します。  
動作確認は「動作確認（30秒）」の手順どおりに辿れます。

## 2. 解決する課題

- **タスクが受信箱に溜まって終わる**: 収集はできるが、分解・実行に移れない
- **週次レビューが“振り返りだけ”で終わる**: 次の行動に繋がらない
- **共有が重い**: 週報を作る/整形する/投稿するのが面倒で継続しにくい

## 3. 主な機能（箇条書き）

- **受信箱（Inbox）**: タスクの追加 / 編集 / 完了切替 / 削除
- **分解（Breakdown）**: 目標 → 実行ステップ案の生成 → 受信箱へ一括保存
- **週間（Weekly）**: 週次メモ/レポートの生成・保存、Next step（1件）の選択
- **Slack共有（任意）**: 週報をIncoming Webhookで投稿
- **ログイン**: GitHub OAuth（ログイン必須ページの保護）

## 4. 想定ユースケース

- **個人の開発タスク整理**: 思いついたタスクを受信箱に集め、週次でNext stepを1つ決めて迷いを減らす
- **小さなチームの週報共有**: 週報をアプリで作成し、Slackに投稿して非同期の共有を軽くする
- **個人開発の運用練習**: DBあり・E2Eあり・CIありの構成で「動くことの証拠」を残す

## 5. 技術スタック

- **フロント/サーバ**: Next.js（App Router）, TypeScript
- **認証**: Auth.js / NextAuth v5（GitHub OAuth）
- **DB/ORM**: PostgreSQL, Prisma
- **AI（任意）**: OpenAI API（`OPENAI_API_KEY` がある場合のみステップ生成に利用。未設定時はテンプレで動作）
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
3. `/breakdown` → 目標入力 → ステップ生成 → 受信箱へ保存
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
- **AI（任意）**: `OPENAI_API_KEY`（未設定でも分解はテンプレで動作）

