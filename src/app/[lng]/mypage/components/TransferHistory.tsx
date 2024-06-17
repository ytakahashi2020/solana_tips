import React, { useState, useEffect } from "react";
import { Transfer } from "../../../../types/transfer";
import { getProjectName } from "../../../../components/utils"; // 新しく作成した関数をインポート
import { useTranslation } from "@/i18n/client"; // useTranslationフックをインポート

interface TransferHistoryProps {
  transferHistory: Transfer[];
  totalAmount: number;
  monthlyTotal: number;
  lng: string; // 言語パラメータを追加
}

const TransferHistory: React.FC<TransferHistoryProps> = ({
  transferHistory,
  totalAmount,
  monthlyTotal,
  lng,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [projectNames, setProjectNames] = useState<{ [key: string]: string }>(
    {}
  );
  const { t } = useTranslation(lng, "transfer_history"); // "transfer_history"は翻訳ファイルのキーです

  useEffect(() => {
    const fetchProjectNames = async () => {
      const names = await Promise.all(
        transferHistory.map(async (transfer) => {
          const name = await getProjectName(transfer.recipient);
          return { [transfer.recipient]: name };
        })
      );
      const namesMap = Object.assign({}, ...names);
      setProjectNames(namesMap);
    };

    fetchProjectNames();
  }, [transferHistory]);

  const handleToggleShowAll = () => {
    setShowAll((prevShowAll) => !prevShowAll);
  };

  const displayedHistory = showAll
    ? transferHistory
    : transferHistory.slice(0, 5);

  return (
    <div>
      {transferHistory.length === 0 ? (
        <p className="text-base">{t("my_page.transfer_history.noHistory")}</p>
      ) : (
        <>
          <ul className="">
            {displayedHistory.map((transfer) => (
              <li
                key={transfer.id}
                className="p-6 bg-white text-sm text-gray-500 border-b"
              >
                <p className="text-base">
                  {
                    new Date(transfer.timestamp.seconds * 1000)
                      .toISOString()
                      .split("T")[0]
                  }
                  : {t("my_page.transfer_history.recipient")}:{" "}
                  <a
                    href={`/${transfer.recipient}`}
                    className="text-blue-500 underline"
                  >
                    {projectNames[transfer.recipient] ||
                      t("my_page.transfer_history.loading")}
                  </a>
                  , {t("my_page.transfer_history.amount")}: {transfer.amount}{" "}
                  tokens, {t("my_page.transfer_history.message")}:{" "}
                  {transfer.message || t("my_page.transfer_history.noMessage")}
                </p>
              </li>
            ))}
          </ul>
          {transferHistory.length > 5 && (
            <p
              onClick={handleToggleShowAll}
              className="mt-4 text-blue-500 cursor-pointer hover:underline text-center"
            >
              {showAll
                ? t("my_page.transfer_history.showLess")
                : t("my_page.transfer_history.showMore")}
            </p>
          )}
          <p className="mt-4 text-sm text-gray-500">
            <strong>{t("my_page.transfer_history.totalAmount")}:</strong>{" "}
            {totalAmount} tokens
          </p>
          <p className="mt-2 text-sm text-gray-500">
            <strong>{t("my_page.transfer_history.monthlyTotal")}:</strong>{" "}
            {monthlyTotal} tokens
          </p>
        </>
      )}
    </div>
  );
};

export default TransferHistory;
