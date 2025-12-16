# 採用担当者向けメモ（5分でレビューするための導線）

このリポジトリは「個人開発のUI」ではなく、**本番で運用できる売り物（小さなSaaS）** を作れるフルスタックとして評価されるように、意図的に形を作っています。

## 1) 何を解決するプロダクトか

タスク管理が失敗するのは「次に何をやるべきか」が曖昧になる瞬間です。  
Workflow Copilot は **Inbox → Breakdown → Weekly → Next step（1つに絞る）** の実行ループを最短化します（任意でSlack共有）。

## 2) まず見る場所（クイックリンク）

- **アーキテクチャ概要**: `docs/ARCHITECTURE.md`
- **セキュリティ観点**: `docs/SECURITY.md`
- **デプロイ/運用の考え方**: `docs/RUNBOOK.md`
- **プロダクトの次**: `docs/ROADMAP.md`

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

## 4) 意図的に未実装の範囲（トレードオフ）

- 課金（Stripe）は未実装（ロードマップ）
- レートリミット/悪用対策は未強化（改善余地として明記）

## 5) 面接での深掘りテーマ例

- チーム版にするなら？（SAML/SCIM、組織管理、細かい権限）
- 強化するなら？（rate limit、悪用対策、管理画面）
- 運用するなら？（runbook、障害対応、シークレットローテーション）


