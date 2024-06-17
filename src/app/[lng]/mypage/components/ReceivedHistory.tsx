import React, { useEffect, useState } from "react";
import {
  getLookuptableAddresses,
  getMessagesForLookupTables,
} from "../../../../components/utils";
import { useTranslation } from "@/i18n/client"; // useTranslationフックをインポート

interface ReceivedHistoryProps {
  creatorAddress: string;
  lng: string; // 言語パラメータを追加
}

const ReceivedHistory: React.FC<ReceivedHistoryProps> = ({
  creatorAddress,
  lng,
}) => {
  const [messages, setMessages] = useState<any[]>([]); // 型は適宜修正してください
  const { t } = useTranslation(lng, "receivedHistory"); // "receivedHistory"は翻訳ファイルのキーです

  useEffect(() => {
    const fetchMessages = async () => {
      const lookupTableAddresses = await getLookuptableAddresses(
        creatorAddress
      );
      const messages = await getMessagesForLookupTables(lookupTableAddresses);
      setMessages(messages);
    };

    fetchMessages();
  }, [creatorAddress]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {t("my_page.receivedHistory.title")}
      </h1>
      {messages.length === 0 ? (
        <p className="text-lg">{t("my_page.receivedHistory.noHistory")}</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((message, index) => (
            <li key={index} className="p-4 bg-gray-50 rounded-lg text-sm">
              <p className="text-sm">
                {
                  new Date(message.timestamp.seconds * 1000)
                    .toISOString()
                    .split("T")[0]
                }
                : {t("my_page.receivedHistory.sender")}: {message.sender},{" "}
                {t("my_page.receivedHistory.message")}:{" "}
                {message.message || t("my_page.receivedHistory.noMessage")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReceivedHistory;
