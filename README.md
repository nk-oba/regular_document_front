# AIエージェント Frontend

Vertex AIを活用したエージェントシステムのフロントエンドアプリケーション

## 🚀 技術スタック

- **React** 18.2.0 + **TypeScript** 5.0.2
- **Vite** 4.4.5 (ビルドツール)
- **Tailwind CSS** 3.3.0 (スタイリング)
- **Axios** 1.6.0 (HTTP通信)

## 📁 プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── ui/             # 再利用可能なUIコンポーネント
│   ├── Chat.tsx        # チャット機能
│   ├── Login.tsx       # ログイン画面
│   └── ...
├── contexts/           # React Context (認証等)
├── hooks/              # カスタムフック
├── lib/                # API関連のユーティリティ
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
├── constants/          # 定数定義
├── services/           # APIサービス
└── assets/             # 静的アセット
```

## 🛠 開発環境のセットアップ

### 必要な環境
- Node.js 18.x 以上
- npm または yarn

### インストール
```bash
npm install
```

### 開発サーバー起動
```bash
npm run dev
```
アプリケーションは http://localhost:3000 で起動します。

### ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

### リンター
```bash
npm run lint
```

## 🔧 設定ファイル

- **vite.config.js** - Viteの設定
- **tailwind.config.js** - Tailwind CSSの設定
- **tsconfig.json** - TypeScriptの設定
- **.eslintrc.js** - ESLintの設定
- **.prettierrc** - Prettierの設定

## 🌍 環境変数

`.env` ファイルで以下の環境変数を設定してください：

```env
VITE_AGENTS_URL=http://localhost:8000
```

## 📦 主要な機能

- **認証システム** - Google OAuth 2.0による認証
- **チャットインターフェース** - リアルタイムチャット機能
- **エージェント選択** - 複数のAIエージェントから選択
- **セッション管理** - チャット履歴の保存・管理
- **ファイルダウンロード** - 生成されたファイルのダウンロード

## 🐳 Docker

Dockerを使用して開発環境を構築できます：

```bash
docker build -t chat-frontend .
docker run -p 3000:3000 chat-frontend
```

## 🔍 開発ガイドライン

### コードスタイル
- ESLint + Prettierでコード品質を管理
- TypeScriptの厳格モードを使用
- コンポーネントは機能ごとに分割

### 命名規則
- コンポーネント: PascalCase
- ファイル: kebab-case または PascalCase
- 変数・関数: camelCase
- 定数: UPPER_SNAKE_CASE

### Git Workflow
1. feature ブランチを作成
2. 変更を実装
3. リンターとビルドを実行
4. Pull Request を作成

## 📄 ライセンス

このプロジェクトは社内プロジェクトです。