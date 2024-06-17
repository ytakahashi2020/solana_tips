"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse"; // CSVパーサーをインポート
import { createLookupTable } from "../../../anchorClient";
import {
  useConnection,
  useWallet,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db, auth, signOut } from "../../../firebase"; // Firebase設定ファイルをインポート
// import { onAuthStateChanged, User } from "firebase/auth";
import { FiCheckCircle } from "react-icons/fi";
import { LngButton } from "../../../components/LngButton/client";
import { useTranslation } from "@/i18n/client";
import { PageParams } from "../../../types/params";

type CsvDataType = string;

const LookupTableComponent: React.FC<PageParams> = ({ params: { lng } }) => {
  const { t } = useTranslation(lng, "main");
  const { publicKey, connected } = useWallet();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [status, setStatus] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [lookupTableAddress, setLookupTableAddress] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [teamName, setTeamName] = useState<string>(""); // チーム名の状態を追加
  const [teamDescription, setTeamDescription] = useState<string>(""); // チームの説明の状態を追加
  const [teamImageFile, setTeamImageFile] = useState<File | null>(null); // チーム画像の状態を追加
  const [csvData, setCsvData] = useState<CsvDataType[]>([]);
  const [teamAddress, setTeamAddress] = useState<string>(""); // チームの住所の状態を追加
  const [teamHomepage, setTeamHomepage] = useState<string>(""); // チームのホームページの状態を追加
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false); // ホワイトリスト状態
  const [whitelistId, setWhitelistId] = useState<string>(""); // ホワイトリストID

  interface Post {
    title: string;
    // 他のフィールドがある場合はここに追加
  }

  useEffect(() => {
    const fetchPosts = async () => {
      const querySnapshot = await getDocs(collection(db, "posts"));
      setPosts(querySnapshot.docs.map((doc) => doc.data() as Post));
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    const checkWhitelist = async () => {
      if (wallet) {
        const userAddress = wallet.publicKey.toBase58();
        console.log("Checking whitelist for address:", userAddress);
        const q = query(
          collection(db, "whitelist"),
          where("address", "==", userAddress)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setIsWhitelisted(true);
          setWhitelistId(querySnapshot.docs[0].id);
        } else {
          setIsWhitelisted(false);
          setWhitelistId("");
        }
      } else {
        // ウォレットが接続されていない場合
        setIsWhitelisted(false);
        setWhitelistId("");
      }
    };

    checkWhitelist();
  }, [wallet]);

  const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: false,
        complete: (results) => {
          const data = results.data as string[];
          setCsvData(data);
        },
        error: (error) => {
          console.error(t("create.csv_error"), error);
          setStatus(t("create.csv_error"));
        },
      });
    }
  };

  const handleImageUpload = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      setTeamImageFile(file);
    }
  };

  const handleLookup = async () => {
    if (!connected) {
      setStatus(t("create.no_wallet"));
      return;
    }
    if (!wallet) {
      setStatus(t("create.no_wallet"));
      return;
    }
    if (!csvData || csvData.length === 0) {
      setStatus(t("create.file_upload"));
      return;
    }
    if (!teamName) {
      setStatus(t("create.team_name"));
      return;
    }
    if (!teamDescription) {
      setStatus(t("create.team_description"));
      return;
    }
    if (!teamImageFile) {
      setStatus(t("create.team_image"));
      return;
    }

    setStatus(t("create.program_running"));

    try {
      const { lookupTableAddress, transactionSignature } =
        await createLookupTable(
          wallet,
          connection,
          csvData,
          teamName,
          teamDescription,
          teamImageFile,
          teamAddress,
          teamHomepage,
          whitelistId
        );
      setStatus(t("create.program_success"));
      setResultUrl(
        `https://solscan.io/tx/${transactionSignature}?cluster=devnet`
      );
      setLookupTableAddress(lookupTableAddress.toBase58());
    } catch (error) {
      console.error(t("create.program_error"), error);
      setStatus(t("create.program_error"));
    }
  };

  return (
    <div className="min-h-screen bg-kumogray flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white p-6 rounded-lg shadow-md">
        {posts.map((post, index) => (
          <div key={index}>{post.title}</div>
        ))}

        <h1 className="text-2xl font-bold mb-4 text-center">
          {t("create.lookup_table_tool")}
        </h1>

        <div className="mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder={t("create.team_name")}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <textarea
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
            placeholder={t("create.team_description")}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={teamAddress}
            onChange={(e) => setTeamAddress(e.target.value)}
            placeholder={t("create.team_address")}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={teamHomepage}
            onChange={(e) => setTeamHomepage(e.target.value)}
            placeholder={t("create.team_homepage")}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {csvData && csvData.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-bold">{t("create.csv_content")}:</h3>
            <table className="table-auto w-full mt-2">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Address</th>
                </tr>
              </thead>
              <tbody>
                {csvData.map((address, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border">{address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mb-4">
          {isWhitelisted && (
            <div className="mt-4 text-green-500">
              <p>{t("create.whitelist_message")}</p>
            </div>
          )}
        </div>
        <div className="mt-4">
          <button
            onClick={handleLookup}
            className={`w-full px-4 py-2 text-white rounded-lg bg-blue-500 hover:bg-blue-600`}
          >
            {t("create.submit_button")}
          </button>
        </div>
        {status && <p className="mt-4 text-green-500">{status}</p>}
        {lookupTableAddress && (
          <p className="mt-2 text-gray-700">
            {t("create.lookup_table_address")}: {lookupTableAddress}
          </p>
        )}
        {resultUrl && (
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-blue-500 underline"
          >
            {t("create.check_transaction")}
          </a>
        )}
      </div>
    </div>
  );
};

export default LookupTableComponent;
