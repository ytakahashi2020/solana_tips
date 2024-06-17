import React, { useEffect, useState } from "react";
import { Message } from "../../../types/message";
import { getUserName } from "../../../components/utils"; // 上記の関数をインポート
import { useTranslation } from "@/i18n/client"; // useTranslationフックをインポート

interface MessagesSectionProps {
  lookupTableAddress: string;
  messages: Message[];
  lng: string; // 言語パラメータを追加
}

const MessagesSection: React.FC<MessagesSectionProps> = ({
  lookupTableAddress,
  messages,
  lng,
}) => {
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  const { t } = useTranslation(lng, "lookup_table"); // "lookup_table"は翻訳ファイルのキーです

  useEffect(() => {
    const fetchUserNames = async () => {
      const newNames: { [key: string]: string } = {};
      for (const msg of messages) {
        if (!userNames[msg.sender]) {
          const name = await getUserName(msg.sender);
          newNames[msg.sender] = name || "Unknown";
        }
      }
      setUserNames((prevNames) => ({ ...prevNames, ...newNames }));
    };

    fetchUserNames();
  }, [messages]);

  // メッセージを新しい順にソート
  const sortedMessages = messages.sort(
    (a, b) => b.timestamp.seconds - a.timestamp.seconds
  );

  return (
    <div className="mt-4 w-full">
      <div className="flex items-center justify-between  mb-4 mt-8 border-b ">
        <h3 className="text-lg font-bold">
          {t("lookup_table.messages_section.title")}
        </h3>
        <span className="text-xs">
          {sortedMessages.length}{" "}
          {t("lookup_table.messages_section.countSuffix")}
        </span>
      </div>
      {sortedMessages.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t("lookup_table.messages_section.noMessages")}
        </p>
      ) : (
        sortedMessages.map((msg, index) => (
          <div key={index} className="mt-2 p-2 border-b border-gray-300">
            <p className="text-sm font-semibold">
              {userNames[msg.sender] || msg.sender}
            </p>
            <p className="text-sm text-gray-500 mt-1">{msg.message}</p>{" "}
          </div>
        ))
      )}
    </div>
  );
};

export default MessagesSection;
