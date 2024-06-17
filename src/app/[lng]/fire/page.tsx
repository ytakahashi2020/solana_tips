"use client";

import React, { useState } from "react";
import Papa from "papaparse"; // CSVパーサーをインポート
import {
  collection,
  addDoc,
  doc,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase"; // Firebase設定ファイルをインポート

interface LookupTableData {
  lookupTableId: string;
  [key: string]: any;
}

interface MemberData {
  name: string;
  imageUrl: string;
  [key: string]: any;
}

interface UpdateData {
  lookupTableId: string;
  teamName: string;
  teamDescription: string;
  teamAddress: string;
  teamHomepage: string;
  teamImageUrl: string;
  [key: string]: any;
}

const CsvToFirestoreComponent: React.FC = () => {
  const [lookupTableData, setLookupTableData] = useState<LookupTableData[]>([]);
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [updateData, setUpdateData] = useState<UpdateData[]>([]);
  const [status, setStatus] = useState<string>("");

  const handleFileUpload = (
    event: any,
    setData: React.Dispatch<React.SetStateAction<any[]>>,
    fileLabel: string
  ) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setData(results.data);
        },
        error: (error) => {
          console.error(`Error parsing ${fileLabel} CSV file`, error);
          setStatus(`Error parsing ${fileLabel} CSV file`);
        },
      });
    }
  };

  const handleUploadToFirestore = async () => {
    if (lookupTableData.length === 0) {
      setStatus("Please upload the Lookup Table CSV file first");
      return;
    }
    if (memberData.length === 0) {
      setStatus("Please upload the Member CSV file first");
      return;
    }

    setStatus("Uploading data to Firestore...");

    try {
      for (const table of lookupTableData) {
        const lookupTableId = table.lookupTableId || "";

        for (const data of memberData) {
          const memberData = {
            name: data.name || "",
            imageUrl: data.imageUrl || "",
          };

          const lookupTableDocRef = doc(db, "lookupTables", lookupTableId);
          const membersCollectionRef = collection(lookupTableDocRef, "members");

          await addDoc(membersCollectionRef, memberData);
        }
      }

      setStatus("Data successfully uploaded to Firestore");
    } catch (error) {
      console.error("Error uploading data to Firestore", error);
      setStatus("Error uploading data to Firestore");
    }
  };

  const handleDeleteMembers = async () => {
    if (lookupTableData.length === 0) {
      setStatus("Please upload the Lookup Table CSV file first");
      return;
    }

    setStatus("Deleting members from Firestore...");

    try {
      for (const table of lookupTableData) {
        const lookupTableId = table.lookupTableId || "";
        const lookupTableDocRef = doc(db, "lookupTables", lookupTableId);
        const membersCollectionRef = collection(lookupTableDocRef, "members");

        const membersSnapshot = await getDocs(membersCollectionRef);
        for (const memberDoc of membersSnapshot.docs) {
          await deleteDoc(memberDoc.ref);
        }
      }

      setStatus("Members successfully deleted from Firestore");
    } catch (error) {
      console.error("Error deleting members from Firestore", error);
      setStatus("Error deleting members from Firestore");
    }
  };

  const handleUpdateLookupTableInfo = async () => {
    if (updateData.length === 0) {
      setStatus("Please upload the Update Lookup Table CSV file first");
      return;
    }

    setStatus("Updating lookup table info...");

    try {
      for (const table of updateData) {
        const lookupTableId = table.lookupTableId || "";
        const lookupTableDocRef = doc(db, "lookupTables", lookupTableId);

        const updateData = {
          teamName: table.teamName || "",
          teamDescription: table.teamDescription || "",
          teamAddress: table.teamAddress || "",
          teamHomepage: table.teamHomepage || "",
          teamImageUrl: table.teamImageUrl || "",
        };

        await updateDoc(lookupTableDocRef, updateData);
      }

      setStatus("Lookup table info successfully updated");
    } catch (error) {
      console.error("Error updating lookup table info", error);
      setStatus("Error updating lookup table info");
    }
  };

  return (
    <div className="min-h-screen bg-kumogray flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          CSV to Firestore
        </h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Lookup Table CSV
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) =>
              handleFileUpload(e, setLookupTableData, "Lookup Table")
            }
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Member CSV
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileUpload(e, setMemberData, "Member")}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Update Lookup Table Info CSV
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) =>
              handleFileUpload(e, setUpdateData, "Update Lookup Table Info")
            }
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {lookupTableData.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Lookup Table CSV Content</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  {Object.keys(lookupTableData[0]).map((header, index) => (
                    <th key={index} className="py-2 px-4 border-b">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lookupTableData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="py-2 px-4 border-b">
                        {value as string | number}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {memberData.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Member CSV Content</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  {Object.keys(memberData[0]).map((header, index) => (
                    <th key={index} className="py-2 px-4 border-b">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {memberData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="py-2 px-4 border-b">
                        {value as string | number}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {updateData.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">
              Update Lookup Table Info CSV Content
            </h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  {Object.keys(updateData[0]).map((header, index) => (
                    <th key={index} className="py-2 px-4 border-b">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {updateData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="py-2 px-4 border-b">
                        {value as string | number}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4">
          <button
            onClick={handleUploadToFirestore}
            className="w-full px-4 py-2 text-white rounded-lg bg-blue-500 hover:bg-blue-600 mb-4"
          >
            Upload to Firestore
          </button>
          <button
            onClick={handleDeleteMembers}
            className="w-full px-4 py-2 text-white rounded-lg bg-red-500 hover:bg-red-600 mb-4"
          >
            Delete Members
          </button>
          <button
            onClick={handleUpdateLookupTableInfo}
            className="w-full px-4 py-2 text-white rounded-lg bg-green-500 hover:bg-green-600"
          >
            Update Lookup Table Info
          </button>
        </div>
        {status && <p className="mt-4 text-center text-gray-700">{status}</p>}
      </div>
    </div>
  );
};

export default CsvToFirestoreComponent;
