"use client";

import React, { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useUserProfile } from "./hooks/useUserProfile";
import ProfileEditForm from "./components/ProfileEditForm";
import ProfileView from "./components/ProfileView";
import TransferHistory from "./components/TransferHistory";
import ReceivedHistory from "./components/ReceivedHistory";
import { useTranslation } from "@/i18n/client";
import { createNFTUsingAkord } from "../../../components/utils";
import { PageParams } from "../../../types/params";
import { ClipLoader } from "react-spinners"; // スピナーをインポート

const MyPage: React.FC<PageParams> = ({ params: { lng } }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { t } = useTranslation(lng, "my_page");
  const [isEditing, setIsEditing] = useState(false);
  const [explorerURL, setExplorerURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // ローディング状態を追加
  const [selectedTab, setSelectedTab] = useState<"transfer" | "received">(
    "transfer"
  ); // タブの状態を追加

  const {
    profile,
    transferHistory,
    totalAmount,
    monthlyTotal,
    profileLoaded,
    isRegistered,
    setProfile,
  } = useUserProfile(wallet);

  const createNFT = async () => {
    try {
      if (!wallet) {
        console.error("Wallet not connected");
        return;
      }

      setIsLoading(true); // ボタンを押した後にローディング状態を設定

      const data = {
        name: profile.name,
        symbol: profile.name,
        description: profile.description,
        image: profile.imageUrl,
        attributes: [
          { trait_type: "totalAmount", value: totalAmount.toString() },
          ...transferHistory.map((transfer, index) => ({
            trait_type: `recipient${index + 1}`,
            value: transfer.recipient,
          })),
        ],
      };
      const tokenID = await createNFTUsingAkord(data); // Akordにデータを保存し、NFTを作成
      const url = `https://core.metaplex.com/explorer/${tokenID}?env=devnet`;
      setExplorerURL(url); // エクスプローラのURLを状態に保存
    } catch (error) {
      console.error("Error saving JSON to Akord: ", error);
    } finally {
      setIsLoading(false); // 処理が完了した後にローディング状態を解除
    }
  };

  if (!wallet) {
    return <div>{t("my_page.connect_wallet")}</div>;
  }

  return (
    <div className="min-h-screen bg-kumogray flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white p-8 rounded-lg shadow-lg ">
        {profileLoaded && isRegistered ? (
          isEditing ? (
            <ProfileEditForm
              userAddress={wallet.publicKey.toBase58()}
              profile={profile}
              setProfile={setProfile}
              setIsEditing={setIsEditing}
              lng={lng}
            />
          ) : (
            <ProfileView
              profile={profile}
              setIsEditing={setIsEditing}
              walletAddress={wallet.publicKey.toBase58()}
              lng={lng}
            />
          )
        ) : (
          profileLoaded && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-6">
                {t("my_page.register_profile")}
              </h1>
              <ProfileEditForm
                userAddress={wallet.publicKey.toBase58()}
                profile={profile}
                setProfile={setProfile}
                setIsEditing={setIsEditing}
                lng={lng}
              />
            </div>
          )
        )}

        <div className="flex mt-6 items-start pb-4 border-b">
          <button
            className={`px-7 py-3 mx-2 w-60 ${
              selectedTab === "transfer"
                ? "bg-baseblue text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-full`}
            onClick={() => setSelectedTab("transfer")}
          >
            {t("my_page.transfer_history_mypage")}
          </button>
          <button
            className={`px-7 py-3 mx-2 w-60 ${
              selectedTab === "received"
                ? "bg-baseblue text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-full`}
            onClick={() => setSelectedTab("received")}
          >
            {t("my_page.received_history_mypage")}
          </button>
        </div>

        {selectedTab === "transfer" ? (
          <TransferHistory
            transferHistory={transferHistory}
            totalAmount={totalAmount}
            monthlyTotal={monthlyTotal}
            lng={lng}
          />
        ) : (
          <ReceivedHistory
            creatorAddress={wallet.publicKey.toBase58()}
            lng={lng}
          />
        )}

        <div className="flex justify-center mt-4">
          <button
            onClick={createNFT}
            className={`px-6 py-3 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-60 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-namiblue hover:bg-blue-600"
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <ClipLoader size={24} color={"#ffffff"} loading={isLoading} />
                <span className="ml-2">{t("my_page.processing")}</span>
              </div>
            ) : (
              t("my_page.issue_nft")
            )}
          </button>
        </div>

        {explorerURL && (
          <>
            <p className="mt-4 text-gray-700">
              {t("my_page.nft_reflection_message")}
            </p>
            <a
              href={explorerURL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full block text-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {t("my_page.view_on_explorer")}
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default MyPage;
