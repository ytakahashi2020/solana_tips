"use client";

import React, { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { saveApplication } from "../../../components/utils";
import { Application } from "../../../types/application"; // Application 型をインポート
import { Timestamp } from "firebase/firestore"; // Firestore の Timestamp をインポート
import { useTranslation } from "@/i18n/client";
import { PageParams } from "../../../types/params";

const ApplicationForm: React.FC<PageParams> = ({ params: { lng } }) => {
  const { t } = useTranslation(lng, "apply");
  const wallet = useAnchorWallet();
  const [projectName, setProjectName] = useState("");
  const [hpAddress, setHpAddress] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!wallet) {
      setStatus(t("apply.status.no_wallet"));
      return;
    }

    const userAddress = wallet.publicKey?.toBase58() || "";
    const applicationData: Omit<Application, "id"> = {
      projectName,
      hpAddress,
      projectDescription,
      contactName,
      contactEmail,
      walletAddress: userAddress,
      submittedAt: Timestamp.fromDate(new Date()), // Firestore Timestamp に変換
      status: "pending", // 初期ステータスを設定
    };

    await saveApplication(applicationData);
    setStatus(t("apply.status.submitted"));
  };

  return (
    <div className="min-h-screen bg-kumogray flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-baseblack">
          {t("apply.application_form")}
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">
              {t("apply.project_name")}
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              {t("apply.hp_address")}
            </label>
            <input
              type="text"
              value={hpAddress}
              onChange={(e) => setHpAddress(e.target.value)}
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              {t("apply.project_description")}
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              {t("apply.contact_name")}
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              {t("apply.contact_email")}
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <div className="mb-4 text-gray-600">
            <p>{t("apply.note")}</p>
          </div>
          <button
            type="submit"
            className="flex justify-center  items-center w-full px-4 py-3 bg-namiblue text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={!wallet}
          >
            {t("apply.submit")}
          </button>
        </form>
        {status && <p className="mt-4 text-green-500">{status}</p>}
      </div>
    </div>
  );
};

export default ApplicationForm;
