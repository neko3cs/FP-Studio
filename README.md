# FP Studio

## Estimate, purely.

FP Studioは、ソフトウェア開発の規模計測を、もっともシンプルで、もっとも正確な体験へと変えるデスクトップアプリケーションです。IPA（情報処理推進機構）の標準的なファンクション・ポイント（FP）法を、洗練されたインターフェイスに凝縮しました。

- **Precision.** DETとFTRを入力するだけで、複雑度を自動判定。
- **Native.** デスクトップならではの軽快なレスポンス。
- **Private.** 重要な見積もりデータは、ローカルのSQLiteに安全に保存。
- **Standard.** IPA/IFPUG準拠のロジックを搭載。

## これは何ができるアプリ？

FP Studioは、業務システムや業務アプリの規模をファンクション・ポイント法で見積もるためのデスクトップアプリです。プロジェクトを作成し、EI / EO / EQ / ILF / EIFごとの機能を登録すると、難易度・UFP・概算工数をまとめて確認できます。

主な用途は次のとおりです。

- 要件定義や見積作成時の初期規模把握
- 複数機能を横並びで整理しながらのFP計測
- チーム内での見積根拠の明文化
- ローカル保存によるオフライン前提の安全な運用

## 主な機能

- プロジェクトの作成、選択、削除
- Function TypeごとのFPエントリ登録
- DET / FTR / RETの入力による難易度自動判定
- 合計UFPの自動集計
- 生産性設定に基づく概算工数の自動計算
- SQLiteによるローカル永続化

## 使い方

基本的な流れは次の4ステップです。

1. プロジェクト名を入力して見積対象の案件を作成します。
2. 画面右側のフォームから機能名、Function Type、DET、FTRまたはRETを入力します。
3. 自動判定された難易度とFPを確認して、機能を追加します。
4. 画面上部の集計カードで合計UFPと概算工数を確認します。

生産性設定を変更すると、UFPはそのままに工数だけを再計算できます。また、登録したプロジェクトや機能はアプリを再起動しても保持されます。

## インストール方法

### 利用者として使う場合

現時点のリポジトリでは、ソースコードから起動する方法がもっとも確実です。配布用ビルドを作成する場合は、後述の `build:mac` / `build:win` / `build:linux` を利用できます。

### 開発環境から起動する場合

前提:

- Node.js
- pnpm

セットアップ:

```bash
git clone https://github.com/neko3cs/FP-Studio.git
cd FP-Studio/src
pnpm install
pnpm dev
```

`better-sqlite3` はElectron向けネイティブモジュールのため、`pnpm dev` と `pnpm start` の実行前に自動でElectron ABI向け再構築が走ります。

## 配布用ビルドの作成

各OS向けの配布物を作るには、`src/` ディレクトリで次のコマンドを実行します。

```bash
pnpm build:mac
pnpm build:win
pnpm build:linux
```

## データ保存先

FP StudioはローカルのSQLiteを使ってデータを保存します。

- macOS: `~/Library/Application Support/FP Studio/`
- Windows: `~/AppData/Roaming/FP Studio/`

業務データをクラウドへ送信しないため、社内見積や機微な要件情報もローカル中心で扱えます。

## トラブルシューティング

### `NODE_MODULE_VERSION` の不一致が出る場合

`better-sqlite3` のElectron向け再構築を実行してください。

```bash
cd src
pnpm run native:electron
```

その後、`pnpm dev` または `pnpm start` を再実行してください。

## テストと検証

変更確認や品質チェックには、`src/` ディレクトリで次を実行します。

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## リポジトリ構成

- `docs/`: 要件や設計メモ
- `src/`: Electronアプリ本体
- `src/e2e/`: PlaywrightによるE2Eテスト

## 補足

このアプリは、FP計測の入力負荷を下げつつ、見積の根拠を残しやすくすることを目的にしています。まずは小さな案件で試し、チームの見積ルールに合わせて生産性設定を調整しながら使うのがオススメです。
