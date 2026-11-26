import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "itinera — 여행 일정 · AI 편집",
  description:
    "여러 여행을 한 곳에서 관리하고, 오른쪽 AI 채팅으로 일정을 바로 고치는 여행 플래너.",
  applicationName: "itinera",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#007c75",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Applies the saved theme before paint so the first frame is not the default preset. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var s=JSON.parse(localStorage.getItem('itinera.state.v2')||'null');var t=s&&s.trips&&s.trips.filter(function(x){return x.id===s.activeTripId})[0];if(t&&t.theme){document.documentElement.dataset.theme=t.theme}}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
