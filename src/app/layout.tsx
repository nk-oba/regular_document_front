import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "定例資料作成支援エージェント",
  description: "Vertex AIを活用した定例資料作成支援エージェント",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
