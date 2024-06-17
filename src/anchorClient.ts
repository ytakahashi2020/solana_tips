import {
  PublicKey,
  SystemProgram,
  Connection,
  TransactionMessage,
  VersionedTransaction,
  AddressLookupTableProgram,
} from "@solana/web3.js";

import { AnchorWallet } from "@solana/wallet-adapter-react";
import { doc, setDoc } from "firebase/firestore"; // Firestoreの関数をインポート
import { db, storage } from "./firebase"; // Firebase設定ファイルをインポート
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function createLookupTable(
  wallet: AnchorWallet,
  connection: Connection,
  csvData: any,
  teamName: string,
  teamDescription: string,
  teamImageFile: File, // チーム画像を追加
  teamAddress?: string, // チームの住所を追加
  teamHomepage?: string, // チームのホームページを追加
  githubUsername?: string,
  whitelistId?: string
) {
  let blockhash = await connection
    .getLatestBlockhash()
    .then((res) => res.blockhash);
  let slot = await connection.getSlot();
  console.log("createLookupTableに渡されたcsvData:", csvData); // デバッグ用

  let admin = new PublicKey("6NKkyM14Q8DpPGBY6S5UXoy1arrPSrQ9a2vWErNzNm12");

  // CSVデータからPublicKeyのリストを作成
  const addresses = csvData.map(
    (address: any) => new PublicKey(address.toString())
  );

  // addressesの先頭にadminを追加
  addresses.unshift(admin);

  const [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: wallet.publicKey,
      payer: wallet.publicKey,
      recentSlot: slot - 1,
    });

  const extendInstruction = AddressLookupTableProgram.extendLookupTable({
    payer: wallet.publicKey,
    authority: wallet.publicKey,
    lookupTable: lookupTableAddress,
    addresses: addresses,
  });

  console.log("lookup table address:", lookupTableAddress.toBase58());

  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions: [lookupTableInst, extendInstruction],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  const signedTransaction = await wallet.signTransaction(transaction);

  const transactionSignature = await connection.sendTransaction(
    signedTransaction
  );

  // Firebase Storageに画像をアップロード
  const storageRef = ref(
    storage,
    `teamImages/${lookupTableAddress.toBase58()}`
  );
  await uploadBytes(storageRef, teamImageFile);
  const teamImageUrl = await getDownloadURL(storageRef);

  // Firestoreにデータを保存
  const docRef = doc(db, "lookupTables", lookupTableAddress.toBase58());
  await setDoc(docRef, {
    lookupTableAddress: lookupTableAddress.toBase58(),
    transactionSignature: transactionSignature,
    teamName: teamName, // チーム名を保存
    teamDescription: teamDescription, // チームの説明を保存
    teamImageUrl: teamImageUrl, // チーム画像URLを保存
    teamAddress: teamAddress || null, // チームの住所を保存
    teamHomepage: teamHomepage || null, // チームのホームページを保存
    createdAt: new Date(),
    githubUsername: githubUsername,
    whitelistId: whitelistId || null,
    creatorAddress: wallet.publicKey.toBase58(), // 作成者のウォレットアドレスを保存
  });

  return {
    lookupTableAddress,
    transactionSignature,
  };
}
