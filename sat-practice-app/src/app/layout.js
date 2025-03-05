import Sidebar from "../components/Sidebar.tsx";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans } from "next/font/google";
import "./global.css";

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

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  // Special handling for the landing page route - we don't need the sidebar there
  const isLandingPage = children?.props?.childProp?.segment === 'landing';

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSans.variable}`}
        style={{ margin: 0, display: "flex" }}
      >
        {!isLandingPage && <Sidebar />}
        <div style={{ 
          marginLeft: isLandingPage ? "0px" : "0px",
          flex: 1,
          width: isLandingPage ? "100%" : "auto" 
        }}>
          {children}
        </div>
      </body>
    </html>
  );
}
