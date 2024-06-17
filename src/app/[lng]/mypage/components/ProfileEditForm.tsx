import React, { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../../firebase";
import { saveUserProfile } from "../../../../components/utils";
import { Profile } from "../../../../types/profile";
import { useTranslation } from "@/i18n/client"; // useTranslationフックをインポート

interface ProfileEditFormProps {
  userAddress: string;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  setIsEditing: (isEditing: boolean) => void;
  lng: string; // 言語パラメータを追加
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  userAddress,
  profile,
  setProfile,
  setIsEditing,
  lng,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(profile.name || "");
  const [description, setDescription] = useState(profile.description || "");
  const [imageUrl, setImageUrl] = useState(profile.imageUrl || "");
  const { t } = useTranslation(lng, "profile_edit"); // "profile_edit"は翻訳ファイルのキーです

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const storageRef = ref(storage, `profileImages/${userAddress}`);
      setIsUploading(true);
      try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setImageUrl(url);
      } catch (error) {
        console.error("Error uploading image: ", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    await saveUserProfile(userAddress, name, description, imageUrl);
    setProfile({ name, description, imageUrl });
    setIsEditing(false);
  };

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-6">
        {t("my_page.profile_edit.title")}
      </h1>
      <div className="mb-4">
        <label className="block text-lg text-gray-700 mb-2">
          {t("my_page.profile_edit.nameLabel")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-3 border rounded w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-lg text-gray-700 mb-2">
          {t("my_page.profile_edit.descriptionLabel")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-3 border rounded w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-lg text-gray-700 mb-2">
          {t("my_page.profile_edit.imageLabel")}
        </label>
        <input
          type="file"
          onChange={handleImageUpload}
          className="p-3 border rounded w-full"
        />
        {imageUrl && (
          <img
            src={imageUrl}
            alt={t("my_page.profile_edit.imageAlt")}
            className="mt-4 w-32 h-32 object-cover rounded-full mx-auto"
          />
        )}
      </div>
      <button
        onClick={handleSaveProfile}
        className={`w-full py-3 mt-6 text-lg text-white rounded-full ${
          isUploading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-namiblue hover:bg-blue-600"
        }`}
        disabled={isUploading}
      >
        {isUploading
          ? t("my_page.profile_edit.uploading")
          : t("my_page.profile_edit.saveButton")}
      </button>
    </div>
  );
};

export default ProfileEditForm;
