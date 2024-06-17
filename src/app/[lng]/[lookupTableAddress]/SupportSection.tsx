import React, { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  handleSupportClick,
  saveTransferHistory,
} from "../../../components/utils";
import { useTranslation } from "@/i18n/client"; // useTranslationフックをインポート

interface SupportSectionProps {
  lookupTableAddress: string;
  fetchAndUpdateBalance: () => Promise<void>;
  fetchAndUpdateMonthlyTotal: () => Promise<void>;
  monthlyTotal: number | null;
  balance: number | null;
  onNewMessage: () => void; // 新しいプロパティを追加
  lng: string; // 言語パラメータを追加
}

const SupportSection: React.FC<SupportSectionProps> = ({
  lookupTableAddress,
  fetchAndUpdateBalance,
  fetchAndUpdateMonthlyTotal,
  monthlyTotal,
  balance,
  onNewMessage, // プロパティを受け取る
  lng,
}) => {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [txId, setTxId] = useState<string | null>(null); // トランザクションIDを保存するステートを追加
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { t } = useTranslation(lng, "lookup_table"); // "lookup_table"は翻訳ファイルのキーです

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSupportConfirm = async () => {
    if (!wallet) return;

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber)) return;

    setShowWarning(false); // ポップアップを閉じる
    const tx = await handleSupportClick(
      amountNumber,
      connection,
      wallet,
      () => {},
      fetchAndUpdateBalance,
      lookupTableAddress
    );

    if (tx) {
      setTxId(tx); // トランザクションIDをステートに保存
    }

    // 送付データを保存
    await saveTransferHistory(
      wallet.publicKey.toBase58(),
      lookupTableAddress,
      amountNumber,
      message // メッセージを保存
    );

    // 月額合計を更新
    fetchAndUpdateMonthlyTotal();

    // 新しいメッセージが追加されたことを通知
    onNewMessage();
  };

  const handleClick = () => {
    const currentAmount = parseFloat(amount);
    if (monthlyTotal !== null && currentAmount + monthlyTotal > 100) {
      setShowWarning(true);
      return;
    }

    handleSupportConfirm();
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4 mr-auto text-baseblack">
        {t("lookup_table.support_section.sendTip")}
      </h2>
      <div className="flex space-x-3 mb-8  w-full ">
        <button
          onClick={() => setAmount("5")}
          className={`px-4 py-3 border-2 border-namiblue rounded-full w-full ${
            amount === "5"
              ? "bg-blue-500 text-white"
              : "text-namiblue border-blue-500"
          }`}
        >
          5 {t("lookup_table.support_section.token")}
        </button>
        <button
          onClick={() => setAmount("10")}
          className={`px-4 py-3 border-2 border-namiblue rounded-full w-full ${
            amount === "10"
              ? "bg-blue-500 text-white"
              : "text-namiblue border-namiblue border-blue-500"
          }`}
        >
          10 {t("lookup_table.support_section.token")}
        </button>
        <button
          onClick={() => setAmount("20")}
          className={`px-4 py-3 border-2 border-namiblue rounded-full w-full ${
            amount === "20"
              ? "bg-blue-500 text-white"
              : "text-namiblue border-blue-500"
          }`}
        >
          20 {t("lookup_table.support_section.token")}
        </button>
      </div>
      <textarea
        value={message}
        onChange={handleMessageChange}
        placeholder={t("lookup_table.support_section.commentPlaceholder")}
        className="mb-4 p-2 border rounded-lg w-full"
      />
      {monthlyTotal !== null && (
        <p className="mb-4 text-sm text-gray-500">
          {t("lookup_table.support_section.monthlyTotal")}: {monthlyTotal}{" "}
          {t("lookup_table.support_section.token")}
        </p>
      )}
      <button
        onClick={handleClick}
        className="w-2/3 px-4 py-3 bg-namiblue text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {t("lookup_table.support_section.send")}
      </button>

      {showWarning && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <p className="text-lg mb-4">
              {t("lookup_table.support_section.warningMessage")}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowWarning(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                {t("lookup_table.support_section.cancel")}
              </button>
              <button
                onClick={handleSupportConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {t("lookup_table.support_section.send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {txId && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg break-words w-full">
          <p>
            <a
              href={`https://solscan.io/tx/${txId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              {t("lookup_table.support_section.transactionId")} {txId}
            </a>
          </p>
        </div>
      )}
    </>
  );
};

export default SupportSection;
