"use client";

import AppWalletProvider from "../../components/AppWalletProvider";
import "@/app/globals.css";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect } from "react";
import { LngButton } from "../../components/LngButton/client";
import { useTranslation } from "@/i18n/client";
import { dir } from "i18next";
import { languages } from "../../i18n/settings";

interface LayoutParams {
  children: React.ReactNode;
  params: {
    lng: string;
  };
}

const RootLayout: React.FC<LayoutParams> = ({ children, params: { lng } }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { t } = useTranslation(lng, "main");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <html lang={lng} dir={dir(lng)}>
      <body>
        <AppWalletProvider>
          <header className="z-20 p-4 bg-white shadow-md border-b opacity-90 w-full fixed">
            <div className="px-2 mx-auto flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-2">
                <img
                  src="/images/logo_image.svg"
                  alt="Logo Image"
                  className="h-9 w-9"
                />
                <img src="/images/logo.svg" alt="Logo Text" className="h-7 pt-1" />
              </Link>
              <nav className="flex items-center justify-between w-full ml-14">
                <div className="flex items-center space-x-7 text-sm">
                  <Link
                    href="/ranking"
                    className="text-baseblack hover:text-blue-600"
                  >
                    {t("layout.ranking")}
                  </Link>
                  <Link
                    href="/apply"
                    className="text-baseblack hover:text-blue-600"
                  >
                    {t("layout.apply")}
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <LngButton lng={lng} />
                  <Link
                    href="/mypage"
                    className="text-white bg-blue-600 min-w-32 hover:bg-blue-700 rounded-lg py-2 px-4 flex items-center ml-4 text-sm h-12"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.121 17.804A13.937 13.937 0 0112 15c2.64 0 5.145.759 7.121 2.021M15 11a3 3 0 11-6 0 3 3 0 016 0zm-3-7a9 9 0 100 18 9 9 0 000-18z"
                      />
                    </svg>
                    {t("layout.mypage")}
                  </Link>
                  <WalletMultiButton />
                </div>
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="bg-baseblue text-white py-6 pb-24">
            <div className="container mx-auto flex justify-start items-center">
              <Link href="/" passHref>
                <div className="flex items-center cursor-pointer">
                  <img
                    src="/images/footer_logo.png"
                    alt={t("layout.footer_logo_alt")}
                    width={250}
                    height={80}
                    className="mr-4"
                  />
                </div>
              </Link>
            </div>
          </footer>
        </AppWalletProvider>
      </body>
    </html>
  );
};

export default RootLayout;
