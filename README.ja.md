# Workflow Copilot AI（日本語）

[![CI](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml)

「受信箱 → 分解 → 週間レビュー →（任意）Slack共有」までを一気通貫で回す、**production-minded** な Next.js アプリです。

> 採用担当者向けの狙い：UIだけでなく、**設計・運用・ガードレール**まで含めて「売り物を作れるフルスタック」を見せる。

## 何のプロダクトか（売り方の前提）

Workflow Copilot は、**忙しい個人（IC）** と **小規模チーム**を想定した「実行ループ最適化」ツールです。

- 受信箱（Inbox）で集める
- 分解（Breakdown）で“次の一歩”に落とす
- 週間（Weekly）で振り返り、**Next step を1つ**に絞る
- 任意で Slack に週報を共有して、非同期の透明性を上げる

## 30秒デモ（最短）

1. `/settings` →（任意）デモデータを準備（有効な環境のみ）
2. `/breakdown` → 目標を入力 → ステップ生成 → 受信箱へ保存
3. `/inbox` → タスク追加/編集/完了
4. `/weekly` → Next step を1つ選ぶ → 週報生成/保存 →（任意）Slack投稿

## このリポジトリで意図的に見せている強み

- **プロダクト思考**: 「振り返り→実行」への断絶を **Next step 1つ**で埋める設計
- **フルスタック実装**: Next.js App Router + Server Actions、Auth、DB、E2E、i18n
- **B2Bの土台**: ワークスペース（Membership）＋招待リンク（Invite）のプリミティブ
- **運用のリアリティ**: Prisma migrations、CIでの migrate、Sentryフック、危険フラグの本番封じ（preflight）
- **RBAC（サーバー強制）**: workspaceの `owner / member` をサーバー側で必ず検証（UIはゲートにしない）
- **監査ログ（forbidden含む）**: 許可/拒否を含む操作ログをActivity Feedに記録
- **招待リンクの安全設計**: 招待トークンはDBに平文で持たず、SHA-256ハッシュで保存（作成直後に一度だけ表示）
- **E2Eで証明**: PlaywrightでRBACと監査ログをロール別に検証

## ドキュメント

- アーキテクチャ: `docs/ARCHITECTURE.md`
- セキュリティ: `docs/SECURITY.md`
- Runbook（運用手順）: `docs/RUNBOOK.md`
- ロードマップ: `docs/ROADMAP.md`
- 変更履歴: `docs/CHANGELOG.md`
- 採用担当者向けメモ: `docs/RECRUITER_NOTES.ja.md`
- 利用規約: `/terms`（アプリ内） + `docs/TERMS.md`
- プライバシー: `/privacy`（アプリ内） + `docs/PRIVACY.md`

## デプロイ（Vercel）

README（英語版）の「Deploy (Vercel)」と「Production deploy checklist」を参照してください。

## ローカル開発（最小）

```bash
npm install
npm run lint
npm run build
```

## E2E（Playwright）

- ローカル/CIのE2Eは **Postgresが必須**です（`DATABASE_URL` / `PRISMA_DATABASE_URL` が必要）。
- ローカル用に `docker-compose.yml` を同梱しています（Dockerがある場合）:
  - `npm run db:up` → `npm run db:migrate` → `npm run test:e2e` → `npm run db:down`
- `npm run test:e2e` は実行前に **preflight** を走らせ、DBのenvが無い場合は分かりやすく即停止します（Prismaのスタックトレースで迷わないため）。

詳細な手順は英語版READMEの「E2E (Playwright)」を参照してください。


