# FP Studio 開発ガイド

FP Studio は、Electron + Vite で構成されたデスクトップアプリケーションです。見積と計測を支える UI とロジックは `src/` 以下の Node / Electron プロジェクトで実装されており、開発時はここを起点に動作を確認します。

## リポジトリ構成

- `src/`: アプリ本体。Electron のメインプロセス、レンダラープロセス、共通モジュールを含みます。
- `src/src/renderer`: React + Fluent UI を使った UI。通常の React フローで開発できます。
- `src/src/main`: Electron の起動処理や IPC ハンドラを管理します。
- `src/tests` など: Vitest や Stryker などのテスト関連コードもこの階層に含まれます。

## セットアップ

リポジトリルート（`/Users/neko3cs/src/FP-Studio`）で依存関係をインストールします。

```bash
pnpm install
```

`better-sqlite3` は Electron 向けのネイティブモジュールのため、`pnpm dev` / `pnpm start` を実行すると自動的に Electron ABI に合わせた再ビルドが走ります。不要なトラブルを避けるには Node のバージョンを固定し、`pnpm install` をやり直した後に `pnpm dev` を再起動してください。

## 開発

```bash
pnpm dev
```

上記コマンドで viewer（renderer）と main の両方がホットリロード付きで立ち上がります。変更を反映させるにはビルド済みの Electron を再起動する必要はほとんどありません。

### ネイティブモジュール再構築

`NODE_MODULE_VERSION` の不一致エラーが出た場合は、次のコマンドを使って Electron 向けに再コンパイルしてください。

```bash
pnpm run native:electron
```

このコマンドは `better-sqlite3` に留まらず、ネイティブバインディングを使っている依存関係全般を Electron ABI に合わせて再構築します。

## 検証

リリース前には以下コマンドを順番に通し、全体の品質を担保します。

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## 開発者向けテスト

このフォルダ内にいる状態でテスト関連コマンドを実行します。

```bash
npm run test
npm run test:coverage
npm run test:mutation
```

### テスト実行の役割

- `npm run test`: Vitest による単体テスト。ソースコードのロジックを網羅的に確認します。
- `npm run test:coverage`: Vitest に `coverage` オプションを追加し、`src/coverage/` に HTML レポートを出力します。ターミナルにもサマリーが表示されます。
- `npm run test:mutation`: Stryker を使った mutation testing。既存テストが意図したとおりにコードの変化を検出できるかを確かめます。

### カバレッジの基準

このリポジトリでは **branch coverage を品質基準** にしており、対象ユニットの **branch coverage が 80% 未満** の場合は `npm run test:coverage` が失敗します。テスト対象の条件分岐やエラー状態を漏れなく扱うことが求められます。

### Mutation テストの確認

`npm run test:mutation` は Stryker が Vitest を呼び出し、mutation score を算出します。結果はコンソールとともに `src/reports/mutation/html/index.html` に保存されるので、出力をブラウザで確認してください。Mutation score が **60% 未満** の場合は基準未達成です。

Mutation score は、テストが本当にロジックの壊れを見つけられるか（壊れたロジックを壊れたままにしないか）を示す指標です。カバレッジと Mutation を併用することで、AIが生成したテストコードも含めて堅牢性を高めます。

## 配布ビルド

プラットフォーム別のパッケージングは以下で実行します。

```bash
pnpm build:mac
pnpm build:win
pnpm build:linux
```

## データ保存とローカル運用

FP Studio はすべてのデータをローカルの SQLite に保存し、クラウドへ送信しません。

- macOS: `~/Library/Application Support/FP Studio/`
- Windows: `~/AppData/Roaming/FP Studio/`

このため業務上の見積データや、見積根拠文書を社内にとどめたまま、安全に取り扱うことができます。

## 参照

- 本番ユーザ向けの利用手順や UI の説明はルートの `README.md` を参考にしてください。
