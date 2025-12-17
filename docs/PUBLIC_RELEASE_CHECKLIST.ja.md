## 公開前チェックリスト（日本語）

目的: 採用担当・レビュー担当が「動く/運用できる」を短時間で確認できる状態にする。

### 1) 本番のスモークテスト（最優先）

- **ヘルスチェック（DB疎通）**
  - `GET /api/health` が 200 で `{ "ok": true, "db": "ok" }`
  - 例: `https://workflow-copilot-ai.vercel.app/api/health`
- **ログイン**
  - GitHub OAuth でログインできる
- **主要フロー**
  - `/breakdown` → ステップ生成 → `/inbox` に保存
  - `/inbox` → 編集/完了
  - `/weekly` → Next step を1つ選び、週次メモ/レポートを保存

### 2) 安全ガード（本番でやってはいけない設定）

- **本番で無効化されていること**
  - `POST /api/e2e/reset` が **404**（E2Eエンドポイントは本番では常に無効）
  - 例: `curl -i -X POST https://YOUR_DOMAIN/api/e2e/reset`
- **本番に入れてはいけない環境変数**
  - `AUTH_BYPASS=1`
  - `DEMO_TOOLS=1`
  - `E2E_TOKEN=e2e`

### 3) リポジトリ表示（採用担当が迷わない）

- GitHubの `README.md` / `README.ja.md` を確認
  - スクショが表示される
  - クイックリンクが死んでいない
- ドキュメント導線（`docs/INDEX.md`、`docs/RECRUITER_NOTES.ja.md`）が辿れる

### 4) ローカル再現（任意）

（面接で「ローカルでも動きますか？」に即答できるように）

- `npm install`
- Postgres起動（Dockerがある場合）: `npm run db:up`
- `npm run db:migrate && npm run db:seed`
- `npm run dev`

### 5) E2E（任意）

- `npm run test:e2e`
  - 事前に preflight が走り、DBのenvが無い場合は分かりやすく停止します

### 6) スクショ差し替え（任意）

- `npm run screenshots`（`docs/screenshots/` に出力）


