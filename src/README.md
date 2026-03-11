# FP Studio

FP Studio は、IPA/IFPUG 準拠の UFP 計測をローカル完結で行う Electron デスクトップアプリケーションです。

## 主な機能

- プロジェクトの作成、一覧表示、削除
- EI / EO / EQ / ILF / EIF の Function Type に対応した FP 計測
- DET と FTR / RET 入力による難易度自動判定
- 合計 UFP と概算工数のリアルタイム表示
- SQLite によるローカル永続化

## セットアップ

```bash
pnpm install
```

`better-sqlite3` は Electron 向けネイティブモジュールのため、`pnpm dev` / `pnpm start` 実行時に自動で Electron ABI 向け再構築が走ります。

アプリのユーザーデータと SQLite は、macOS では `~/Library/Application Support/FP Studio/` に保存されます。

## 開発

```bash
pnpm dev
```

もし `NODE_MODULE_VERSION` の不一致が出た場合は、以下を実行してから再起動してください。

```bash
pnpm run native:electron
```

## 検証

```bash
pnpm lint
pnpm test
pnpm build
```

## 配布ビルド

```bash
pnpm build:mac
pnpm build:win
pnpm build:linux
```
