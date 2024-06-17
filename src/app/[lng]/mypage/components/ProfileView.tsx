import React from "react";
import { Profile } from "../../../../types/profile";
import { useTranslation } from "@/i18n/client"; // useTranslationフックをインポート

interface ProfileViewProps {
  profile: Profile;
  setIsEditing: (isEditing: boolean) => void;
  walletAddress: string;
  lng: string; // 言語パラメータを追加
}

const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  setIsEditing,
  walletAddress,
  lng,
}) => {
  const { t } = useTranslation(lng, "main"); // "profile"は翻訳ファイルのキーです

  return (
    <div>
      <div className="flex items-start mb-8">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md">
          <img
            src={profile.imageUrl || "/default-profile.png"}
            alt={t("my_page.profile_view.imageAlt")} // 画像のaltテキストを翻訳
            className="w-full h-full object-cover"
          />
        </div>
        <div className="ml-6 w-2/3 mr-6">
          <h1 className="text-3xl font-bold text-baseblack mb-4 ">{profile.name}</h1>
          <p className="text-gray-500 text-sm mb-4">{walletAddress}</p>
          <p className="text-gray-700 text-sm leading-relaxed">{profile.description}</p>
        </div>
        <button
        onClick={() => setIsEditing(true)}
        className="px-6 py-3 text-baseblue bg-kumogray rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 "
      >
        {t("my_page.profile_view.editButton")} {/* ボタンのテキストを翻訳 */}
      </button>
      </div>

    </div>
  );
};

export default ProfileView;
