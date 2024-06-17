import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useTranslation } from "@/i18n/client"; // useTranslationフックをインポート

interface MembersListProps {
  lookupTableAddress: string;
  lng: string; // 言語パラメータを追加
}

interface Member {
  id: string;
  name: string;
  imageUrl: string;
}

const MembersList: React.FC<MembersListProps> = ({
  lookupTableAddress,
  lng,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const { t } = useTranslation(lng, "lookup_table"); // "lookup_table"は翻訳ファイルのキーです

  const fetchMembers = async () => {
    const membersCollectionRef = collection(
      db,
      "lookupTables",
      lookupTableAddress,
      "members"
    );
    const querySnapshot = await getDocs(membersCollectionRef);
    const membersList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Member[];
    setMembers(membersList);
  };

  useEffect(() => {
    fetchMembers();
  }, [lookupTableAddress]);

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4 border-b">
        <h3 className="text-lg font-bold text-baseblack ">
          {t("lookup_table.member_list.title")}
        </h3>
        <span className="text-xs text-baseblack">
          {members.length} {t("lookup_table.member_list.countSuffix")}
        </span>
      </div>
      {members.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t("lookup_table.member_list.noMembers")}
        </p>
      ) : (
        members.map((member) => (
          <div
            key={member.id}
            className="mt-2 p-2 px-4 border rounded-lg bg-gray-50 flex items-center"
          >
            <img
              src={member.imageUrl}
              alt={member.name}
              className="w-10 h-10 rounded-full mr-2"
            />
            <p className="text-sm text-gray-700">{member.name}</p>
              <svg 
              className="w-4 h-4 text-namiblue ml-auto opacity-30"
              xmlns="http://www.w3.org/2000/svg" 
              fill="namiblue"
              viewBox="0 0 512 512"
              stroke="currentColor">
              
              <path 
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/></svg>
          </div>
        ))
      )}
    </div>
  );
};

export default MembersList;
