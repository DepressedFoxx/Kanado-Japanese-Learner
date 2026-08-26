import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Kanadō — học tiếng Nhật tới N4",
  description:
    "Bảng chữ, kanji, từ vựng, ngữ pháp N5–N4, flashcard lặp lại ngắt quãng và đề kiểm tra, đồng bộ tiến độ giữa các máy.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E7ECF1" },
    { media: "(prefers-color-scheme: dark)", color: "#0F161E" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Shippori+Mincho:wght@500;700&display=swap"
        />
      </head>
      <body>
        <Providers>
          <SiteHeader />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
