import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans, Roboto } from "next/font/google";
import "./global.css";
import Providers from './providers';
import ConditionalLayout from './components/ConditionalLayout.jsx';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

// ... existing code ...
export const metadata = {
  title: "Brill - Get Your Best SAT Score",
  description: "AI-powered SAT prep platform",
  icons: {
    icon: [
      { url: '/assets/images/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/images/icon.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/assets/images/icon.png',
    apple: '/assets/images/icon.png',
    other: [
      {
        rel: 'apple-touch-icon',
        url: '/assets/images/icon.png',
      }
    ]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSans.variable}`}
        style={{ margin: 0, display: "flex" }}
      >
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
