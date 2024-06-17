"use client";

import React, { useState, useEffect } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  getAdminAddresses,
  getApplications,
  updateApplicationStatus,
} from "../../../components/utils";
import { Application } from "../../../types/application";
import { useTranslation } from "@/i18n/client";
import { PageParams } from "../../../types/params";

const AdminPage: React.FC<PageParams> = ({ params: { lng } }) => {
  const wallet = useAnchorWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<{
    [key: string]: string;
  }>({});
  const [pendingUpdates, setPendingUpdates] = useState<string[]>([]);

  const { t } = useTranslation(lng, "main");

  useEffect(() => {
    const checkAdmin = async () => {
      if (wallet) {
        const adminAddresses = await getAdminAddresses();
        const userAddress = wallet.publicKey.toBase58();
        setIsAdmin(adminAddresses.includes(userAddress));
      }
      setLoading(false);
    };

    checkAdmin();
  }, [wallet]);

  useEffect(() => {
    const fetchApplications = async () => {
      if (isAdmin) {
        const apps = await getApplications();
        setApplications(apps);
      }
    };

    fetchApplications();
  }, [isAdmin]);

  const handleStatusChange = (id: string, status: string) => {
    setSelectedStatus((prev) => ({ ...prev, [id]: status }));
    setPendingUpdates((prev) => [...prev, id]);
  };

  const handleUpdateStatus = async (id: string) => {
    if (selectedStatus[id]) {
      await updateApplicationStatus(id, selectedStatus[id]);
      setPendingUpdates((prev) => prev.filter((updateId) => updateId !== id));
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isAdmin) {
    return <p>You are not authorized to view this page.</p>;
  }

  return (
    <div className="min-h-screen bg-kumogray flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">
          {t("admin.applications_list")}
        </h1>
        {applications.length === 0 ? (
          <p>{t("admin.no_applications_found")}</p>
        ) : (
          <ul>
            {applications.map((app) => (
              <li key={app.id} className="mb-4 p-4 border rounded-lg">
                <p>
                  <strong>{t("admin.project_name")}:</strong> {app.projectName}
                </p>
                <p>
                  <strong>{t("admin.hp_address")}:</strong> {app.hpAddress}
                </p>
                <p>
                  <strong>{t("admin.project_description")}:</strong>{" "}
                  {app.projectDescription}
                </p>
                <p>
                  <strong>{t("admin.contact_name")}:</strong> {app.contactName}
                </p>
                <p>
                  <strong>{t("admin.contact_email")}:</strong>{" "}
                  {app.contactEmail}
                </p>
                <p>
                  <strong>{t("admin.wallet_address")}:</strong>{" "}
                  {app.walletAddress}
                </p>
                <p>
                  <strong>{t("admin.submitted_at")}:</strong>{" "}
                  {new Date(app.submittedAt.seconds * 1000).toLocaleString()}
                </p>
                <div className="mt-4">
                  <label className="block text-gray-700">
                    {t("admin.status")}:
                  </label>
                  <select
                    value={selectedStatus[app.id] || app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="block w-full mt-2 border rounded p-2"
                  >
                    <option value="pending">
                      {t("admin.status_options.pending")}
                    </option>
                    <option value="approved">
                      {t("admin.status_options.approved")}
                    </option>
                    <option value="rejected">
                      {t("admin.status_options.rejected")}
                    </option>
                  </select>
                  {pendingUpdates.includes(app.id) && (
                    <button
                      onClick={() => handleUpdateStatus(app.id)}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      {t("admin.confirm")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
