FROM node:18-alpine

# 必要なパッケージをインストール
RUN apk add --no-cache libc6-compat

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package.json package-lock.json ./

# 依存関係をインストール
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# ビルドを実行
RUN npm run build

EXPOSE 3000

# 開発サーバーではなく、ビルドされたファイルを配信
CMD ["npm", "run", "preview"]