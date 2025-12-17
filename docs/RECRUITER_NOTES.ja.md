# 採用担当者向けメモ（5分でレビューするための導線）

このリポジトリは「個人開発のUI」ではなく、**本番で運用できる売り物（小さなSaaS）** を作れるフルスタックとして評価されるように、意図的に形を作っています。

## TL;DR（何が評価ポイント？）

- **再現性**: CIで `lint / i18n / build / E2E` を毎回実行（`.github/workflows/ci.yml`）
- **運用の視点**: runbook・ヘルスチェック・本番ガード（`docs/RUNBOOK.md`, `GET /api/health`, `scripts/preflight-prod.mjs`）
- **安全設計**: RBACをサーバーで強制 + 監査ログ（`docs/ARCHITECTURE.md`）

## 1) 何を解決するプロダクトか

タスク管理が失敗するのは「次に何をやるべきか」が曖昧になる瞬間です。  
Workflow Copilot は **Inbox → Breakdown → Weekly → Next step（1つに絞る）** の実行ループを最短化します（任意でSlack共有）。

## 2) まず見る場所（クイックリンク）

- **アーキテクチャ概要**: `docs/ARCHITECTURE.md`
- **セキュリティ観点**: `docs/SECURITY.md`
- **デプロイ/運用の考え方**: `docs/RUNBOOK.md`
- **プロダクトの次**: `docs/ROADMAP.md`
- **日本語README（再現手順）**: `README.ja.md`

## 3) “売り物っぽさ”の根拠（運用・品質のシグナル）

- **Auth**: Auth.js / NextAuth v5（JWTセッション）＋Edge middlewareでの保護
- **マイグレーション前提**: `prisma migrate deploy` をCI/CDで回す設計（`npm run vercel-build`）
- **危険フラグの本番封じ**: `preflight:prod` が `AUTH_BYPASS` / `DEMO_TOOLS` / `E2E_TOKEN` を本番でブロック
- **E2Eの決定性**: `/api/e2e/reset`（フラグ＋トークンでガード）
- **i18nの規律**: `en.json` と `ja.json` のキー一致をCIで強制
- **B2Bの実装（ここが強み）**:
  - ワークスペース（マルチテナント）＋Membership（`owner` / `member`）
  - **RBACはサーバー側で強制**（UIで隠すだけにしない）
  - **監査ログ**: 成功イベントだけでなく `forbidden`（拒否）も記録。Settingsに履歴フィルタあり
  - 招待リンクはrole指定/期限/回数上限つきで、使用/上限到達もログに残る
  - **招待トークンは平文保存しない**（`tokenHash`=SHA-256）。リンクは作成直後に一度だけ表示
  - **レース耐性**: 招待受諾はDB行ロック（`FOR UPDATE`）で `maxUses` 超過を防止

## 4) “証拠”として見せられる場所（コード/テスト）

- **CIの実行内容**: `.github/workflows/ci.yml`
- **本番安全ガード**: `scripts/preflight-prod.mjs`
- **E2Eの本番無効化 + トークンガード**: `src/app/api/e2e/reset/route.ts`
- **E2Eテスト**: `tests/e2e/`（RBAC/監査ログ: `tests/e2e/rbac-audit.spec.ts`）
- **ヘルスチェック（DB疎通）**: `src/app/api/health/route.ts`

## 5) 意図的に未実装の範囲（トレードオフ）

- 課金（Stripe）は未実装（ロードマップ）
- レートリミット/悪用対策は未強化（改善余地として明記）

## 6) 面接での深掘りテーマ例（実務評価に繋がる質問）

- **RBACの境界**: どこで権限を判定しているか？UIとサーバの役割分担は？
- **監査ログの設計**: 何を記録しているか？`forbidden` を記録する意図は？
- **招待リンクの安全性**: tokenを平文で持たない理由、期限/回数上限の設計
- **E2Eの決定性**: なぜリセットAPIが必要か？本番でどう無効化しているか？
- **運用**: もし本番でログイン/書き込みが落ちたら、何から調べるか？（`docs/RUNBOOK.md`）


