import { Inter } from "next/font/google";
import AuthSessionProvider from "@/components/drive/AuthSessionProvider.js";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "kabeadAuto",
  description: "Admin Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
