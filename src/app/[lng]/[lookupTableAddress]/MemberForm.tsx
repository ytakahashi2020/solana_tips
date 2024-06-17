import React, { useState } from "react";
import { addMember } from "../../../components/utils"; // utils.tsの関数をインポート
import { Member } from "../../../types/member";
import { storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTranslation } from "@/i18n/client"; // useTranslationフックをインポート

interface MemberFormProps {
  lookupTableAddress: string;
  fetchMembers: () => void;
  lng: string; // 言語パラメータを追加
}

const MemberForm: React.FC<MemberFormProps> = ({
  lookupTableAddress,
  fetchMembers,
  lng,
}) => {
  const [members, setMembers] = useState<
    { name: string; imageFile: File | null }[]
  >([{ name: "", imageFile: null }]);
  const { t } = useTranslation(lng, "lookup_table"); // "lookup_table"は翻訳ファイルのキーです

  const handleNameChange = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index].name = value;
    setMembers(newMembers);
  };

  const handleImageChange = (index: number, file: File | null) => {
    const newMembers = [...members];
    newMembers[index].imageFile = file;
    setMembers(newMembers);
  };

  const handleAddMember = async () => {
    const membersToAdd = members.filter(
      (member) => member.name && member.imageFile
    );

    if (membersToAdd.length === 0) return;

    for (const member of membersToAdd) {
      const storageRef = ref(
        storage,
        `memberImages/${lookupTableAddress}/${member.imageFile!.name}`
      );
      await uploadBytes(storageRef, member.imageFile!);
      const imageUrl = await getDownloadURL(storageRef);

      await addMember(lookupTableAddress, {
        name: member.name,
        imageUrl,
      });
    }

    setMembers([{ name: "", imageFile: null }]);
    fetchMembers();
  };

  const handleAddForm = () => {
    setMembers([...members, { name: "", imageFile: null }]);
  };

  const handleRemoveForm = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold text-baseblack mb-4">
        {t("lookup_table.member_form.add_member")}
      </h3>
      {members.map((member, index) => (
        <div key={index} className="mb-4 p-4 border rounded-lg bg-kumogray">
          <input
            type="text"
            value={member.name}
            onChange={(e) => handleNameChange(index, e.target.value)}
            placeholder={t("lookup_table.member_form.namePlaceholder")}
            className="mb-2 p-2 border rounded-lg w-full bg-white"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleImageChange(
                index,
                e.target.files ? e.target.files[0] : null
              )
            }
            className="mb-2 p-2 border rounded-lg w-full bg-white"
          />
          <button
            onClick={() => handleRemoveForm(index)}
            className="px-4 py-2 bg-baseblack text-white rounded-lg  text-xs"
          >
            {t("lookup_table.member_form.removeButton")}
          </button>
        </div>
      ))}
      <button
        onClick={handleAddForm}
        className="mb-2 px-4 py-2 bg-baseblue text-white rounded-lg mr-4 "
      >
        + {t("lookup_table.member_form.addAnotherMember")}
      </button>
      <button
        onClick={handleAddMember}
        className="px-4 py-2 bg-baseblue text-white rounded-lg"
      >
        {t("lookup_table.member_form.addMembersButton")}
      </button>
    </div>
  );
};

export default MemberForm;
