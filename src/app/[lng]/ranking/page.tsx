"use client";

import React, { useEffect, useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  getTopMonthlySenders,
  getAdminAddresses,
  getAllMonthlySenders,
  createNFTUsingAkord,
  saveWinnerDataToFirestore,
} from "../../../components/utils";
import { ClipLoader } from "react-spinners";
import { useTranslation } from "@/i18n/client";
import { PageParams } from "../../../types/params";

interface MonthlyTotal {
  sender: string;
  totalAmount: number;
}

const RankingPage: React.FC<PageParams> = ({ params: { lng } }) => {
  const { t } = useTranslation(lng, "ranking");
  const [topSenders, setTopSenders] = useState<MonthlyTotal[]>([]);
  const [allSenders, setAllSenders] = useState<MonthlyTotal[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [explorerURL, setExplorerURL] = useState<string | null>(null); // エクスプローラURLを状態に追加
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false); // ローディング状態を追加
  const wallet = useAnchorWallet();

  useEffect(() => {
    const fetchTopSenders = async () => {
      const senders = await getTopMonthlySenders();
      setTopSenders(senders);
    };

    const fetchAllSenders = async () => {
      const senders = await getAllMonthlySenders();
      setAllSenders(senders);
    };

    const checkAdmin = async () => {
      if (wallet) {
        const adminAddresses = await getAdminAddresses();
        const userAddress = wallet.publicKey.toBase58();
        setIsAdmin(adminAddresses.includes(userAddress));
      }
    };

    const setCurrentDate = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.toLocaleString("default", { month: "long" });
      setCurrentMonth(`${month} ${year}`);
    };

    fetchTopSenders();
    fetchAllSenders();
    checkAdmin();
    setCurrentDate();
  }, [wallet]);

  const drawLottery = async () => {
    if (allSenders.length === 0) return;

    const totalAmount = allSenders.reduce(
      (sum, sender) => sum + sender.totalAmount,
      0
    );
    const random = Math.random() * totalAmount;

    let cumulativeSum = 0;
    let winner: MonthlyTotal | null = null;
    for (const sender of allSenders) {
      cumulativeSum += sender.totalAmount;
      if (random < cumulativeSum) {
        winner = sender;
        break;
      }
    }

    if (winner) {
      setSelectedWinner(winner.sender);

      try {
        setIsLoading(true);

        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 月は0始まりなので+1
        const formattedMonth = month.toString().padStart(2, "0");

        const data = {
          name: `${year} ${month} Lottery Result`,
          symbol: `${year}${formattedMonth}`,
          description: `This is the ${year} ${month} lottery result.`,
          image: `https://arweave.net/PZro98EOmQob8WdTA73wrLBg8Kc47VMmdyc-GXAJ_h0`,
          attributes: [{ trait_type: "winner", value: winner.sender }],
        };

        const tokenID = await createNFTUsingAkord(data, false);
        const url = `https://core.metaplex.com/explorer/${tokenID}?env=devnet`;

        // 新しいコレクションにデータを保存
        await saveWinnerDataToFirestore(
          tokenID,
          winner.sender,
          `${year}${formattedMonth}`
        );

        // エクスプローラURLを状態に保存
        setExplorerURL(url);
      } catch (error) {
        console.error("Error creating NFT: ", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-kumogray flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-12 text-center text-baseblack ">
          {t("ranking.monthly_donation_ranking", { currentMonth })}
        </h1>
      <div className="max-w-5xl w-full bg-white p-6 rounded-lg shadow-md">
        <table className="min-w-full bg-white text-baseblack">
          <thead>
            <tr>
              <th className="py-2">{t("ranking.rank")}</th>
              <th className="py-2">{t("ranking.sender_account")}</th>
              <th className="py-2">{t("ranking.total_amount")}</th>
            </tr>
          </thead>
          <tbody>
            {topSenders.map((sender, index) => (
              <tr key={sender.sender}>
                <td className="py-4 text-center">{index + 1}</td>
                <td className="py-4 text-center">{sender.sender}</td>
                <td className="py-4 text-center">{sender.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isAdmin ? (
          <button
            onClick={drawLottery}
            className={`mt-4 w-full px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <ClipLoader size={24} color={"#ffffff"} loading={isLoading} />
                <span className="ml-2">{t("ranking.processing")}</span>
              </div>
            ) : (
              t("ranking.draw_lottery")
            )}
          </button>
        ) : (
          <button
            className="mt-6 mt-6 w-full px-4 py-3 bg-kasumigray text-white rounded-full cursor-not-allowed"
            disabled
          >
            {t("ranking.draw_lottery")}
          </button>
        )}
        {selectedWinner && (
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold">
              {t("ranking.winner", { selectedWinner })}
            </p>
          </div>
        )}
        {explorerURL && (
          <>
            <p className="mt-4 text-gray-700">
              {t("ranking.explorer_message")}
            </p>
            <a
              href={explorerURL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full block text-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {t("ranking.view_on_explorer")}
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default RankingPage;
