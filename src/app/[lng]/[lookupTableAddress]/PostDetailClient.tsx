"use client";

import React, { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Post } from "./page";
import {
  fetchBalance,
  getMonthlyTotal,
  getMessagesForPost,
  getCreatorAddress,
} from "../../../components/utils";
import { useTranslation } from "@/i18n/client";
import SupportSection from "./SupportSection";
import MessagesSection from "./MessagesSection";
import { Message } from "../../../types/message"; // Messageインターフェースをインポート
import QRCode from "qrcode.react"; // QRコード生成ライブラリをインポート
import MembersList from "./MembersList"; // メンバーリストコンポーネントをインポート
import MemberForm from "./MemberForm"; // メンバー追加フォームコンポーネントをインポーネート
import { translateText } from "../../../components/translateUtils"; // 翻訳ユーティリティをインポート

interface PostDetailClientProps {
  post: Post;
  params: { lng: string };
}

const PostDetailClient: React.FC<PostDetailClientProps> = ({
  post,
  params: { lng },
}) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [isCreator, setIsCreator] = useState<boolean>(false); // クリエイター判定用の状態
  const [translatedDescription, setTranslatedDescription] = useState<string>(
    post.teamDescription
  ); // 翻訳後の説明
  const [translatedTeamName, setTranslatedTeamName] = useState<string>(
    post.teamName
  ); // 翻訳後のチーム名
  const [showPopup, setShowPopup] = useState<boolean>(false); // ポップアップ表示用の状態
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { t } = useTranslation(lng, "main");

  const fetchAndUpdateBalance = async () => {
    if (wallet) {
      const balance = await fetchBalance(wallet, connection);
      setBalance(balance);
    }
  };

  const fetchAndUpdateMonthlyTotal = async () => {
    if (wallet) {
      const userAddress = wallet.publicKey.toBase58();
      const total = await getMonthlyTotal(userAddress);
      setMonthlyTotal(total);
    }
  };

  const fetchMessages = async () => {
    const messages = await getMessagesForPost(post.lookupTableAddress);
    setMessages(messages);
  };

  const checkIsCreator = async () => {
    if (wallet) {
      const creatorAddress = await getCreatorAddress(post.lookupTableAddress);
      if (creatorAddress && creatorAddress === wallet.publicKey.toBase58()) {
        setIsCreator(true);
      } else {
        setIsCreator(false);
      }
    }
  };

  useEffect(() => {
    fetchAndUpdateBalance();
    fetchAndUpdateMonthlyTotal();
    fetchMessages();
    checkIsCreator();
  }, [wallet, connection]);

  const handleNewMessage = () => {
    fetchMessages();
  };

  const fetchMembers = async () => {
    // メンバーを取得する関数
  };

  return (
    <div className="min-h-screen bg-kumogray flex items-center justify-center p-4 pb-16">
      <div className="max-w-5xl w-full bg-white p-6 rounded-lg shadow-md mt-32">
        <h1 className="text-4xl font-bold mb-10 text-center text-baseblack">
          {translatedTeamName}
        </h1>
        <div className="flex justify-center">
          <div className="w-1/2">
            <div className="w-11/12 mx-auto">
              <div className="flex flex-col items-center pb-5 text-baseblack">
                {post.teamImageUrl && (
                  <img
                    src={post.teamImageUrl}
                    alt="Team"
                    className="mt-2 rounded-lg"
                  />
                )}
              </div>
              <div className="mt-2">
                <div className="flex items-start justify-between text-sm text-namiblue underline">
                  <div className="flex items-center">
                    <button
                      onClick={() => setShowPopup(true)}
                      className="focus:outline-none"
                    >
                      {t("lookup_table.post_detail_client.translate")}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowQRCode(true)}
                    className="no-underline text-base ml-4 bg-kumogray text-baseblue px-6 py-2 flex justify-center items-center rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
                  >
                    {`ID: ${post.lookupTableAddress.slice(
                      0,
                      3
                    )}...${post.lookupTableAddress.slice(-3)}`}
                    <svg
                      className="w-4 h-4 ml-2"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 448 512"
                      fill="currentColor"
                    >
                      <path d="M0 80C0 53.5 21.5 32 48 32h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80zM64 96v64h64V96H64zM0 336c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V336zm64 16v64h64V352H64zM304 32h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H304c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48zm80 64H320v64h64V96zM256 304c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s7.2-16 16-16s16 7.2 16 16v96c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16s-7.2-16-16-16s-16 7.2-16 16v64c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V304zM368 480a16 16 0 1 1 0-32 16 16 0 1 1 0 32zm64 0a16 16 0 1 1 0-32 16 16 0 1 1 0 32z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-4">
                {post.teamAddress && (
                  <div className="flex items-center mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-baseblue mr-1"
                      viewBox="0 0 320 512"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16 144a144 144 0 1 1 288 0A144 144 0 1 1 16 144zM160 80c8.8 0 16-7.2 16-16s-7.2-16-16-16c-53 0-96 43-96 96c0 8.8 7.2 16 16 16s16-7.2 16-16c0-35.3 28.7-64 64-64zM128 480V317.1c10.4 1.9 21.1 2.9 32 2.9s21.6-1 32-2.9V480c0 17.7-14.3 32-32 32s-32-14.3-32-32z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-baseblue">{post.teamAddress}</p>
                  </div>
                )}
                {post.teamHomepage && (
                  <div className="flex items-center mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-baseblue mr-1"
                      viewBox="0 0 640 512"
                      fill="currentColor"
                    >
                      <path d="M128 32C92.7 32 64 60.7 64 96V352h64V96H512V352h64V96c0-35.3-28.7-64-64-64H128zM19.2 384C8.6 384 0 392.6 0 403.2C0 445.6 34.4 480 76.8 480H563.2c42.4 0 76.8-34.4 76.8-76.8c0-10.6-8.6-19.2-19.2-19.2H19.2z" />
                    </svg>
                    <a
                      href={post.teamHomepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-baseblue underline"
                    >
                      {post.teamHomepage}
                    </a>
                  </div>
                )}
              </div>

              <p className="mt-4 text-baseblack leading-relaxed ">
                {translatedDescription}
              </p>

              {post.whitelistId && (
                <div className="mt-4 p-4 border-l-4 border-green-500 bg-green-100 rounded-lg flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-sm text-green-700">
                    {t("lookup_table.post_detail_client.white_list")}
                    <strong>{post.whitelistId}</strong>
                  </p>
                </div>
              )}
              <MembersList
                lookupTableAddress={post.lookupTableAddress}
                lng={lng}
              />
              {isCreator && (
                <MemberForm
                  lookupTableAddress={post.lookupTableAddress}
                  fetchMembers={fetchMembers}
                  lng={lng}
                />
              )}
            </div>
          </div>

          <div className="w-1/2 pl-4 flex flex-col items-center">
            <SupportSection
              lookupTableAddress={post.lookupTableAddress}
              fetchAndUpdateBalance={fetchAndUpdateBalance}
              fetchAndUpdateMonthlyTotal={fetchAndUpdateMonthlyTotal}
              monthlyTotal={monthlyTotal}
              balance={balance}
              onNewMessage={handleNewMessage}
              lng={lng}
            />

            <MessagesSection
              lookupTableAddress={post.lookupTableAddress}
              messages={messages}
              lng={lng}
            />
          </div>
        </div>
        {showQRCode && post.teamHomepage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                  {t("lookup_table.post_detail_client.homepage_qr")}
                </h2>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <QRCode
                value={`https://solana-hackathon-ytakahashi2020-ytakahashi2020s-projects.vercel.app/en/${post.lookupTableAddress}`}
                size={256}
              />
            </div>
          </div>
        )}
        {showPopup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                  {" "}
                  {t("lookup_table.post_detail_client.info")}
                </h2>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-baseblack">
                {t("lookup_table.post_detail_client.info_desc1")}
              </p>
              <p className="text-baseblack">
                {t("lookup_table.post_detail_client.info_desc2")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailClient;
