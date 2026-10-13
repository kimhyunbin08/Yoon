import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "조각방",
  description: "켜두고 공부하는 파스텔 공부방",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-512.png" },
};

export const viewport: Viewport = { themeColor: "#fbf7f2" };

// Sets the time-of-day theme before first paint so the room never flashes daytime colors at night.
const themeScript = `(function(){var h=new Date().getHours(),e=document.documentElement;
e.dataset.window=h>=5&&h<9?"dawn":h>=9&&h<17?"day":h>=17&&h<21?"evening":"night";
e.dataset.sky=h>=21||h<3?"night":h<5?"predawn":h<7?"dawn":h<10?"morning":h<14?"midday":h<17?"afternoon":h<19?"evening":"twilight";})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
