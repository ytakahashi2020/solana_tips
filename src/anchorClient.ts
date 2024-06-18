import {
  PublicKey,
  SystemProgram,
  Connection,
  TransactionMessage,
  VersionedTransaction,
  AddressLookupTableProgram,
} from "@solana/web3.js";

import { AnchorWallet } from "@solana/wallet-adapter-react";
import { doc, setDoc } from "firebase/firestore";
import { db, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function createLookupTable(
  wallet: AnchorWallet,
  connection: Connection,
  csvData: any,
  teamName: string,
  teamDescription: string,
  teamImageFile: File,
  teamAddress?: string,
  teamHomepage?: string,
  githubUsername?: string,
  whitelistId?: string
) {
  let blockhash = await connection
    .getLatestBlockhash()
    .then((res) => res.blockhash);
  let slot = await connection.getSlot();
  console.log("createLookupTableに渡されたcsvData:", csvData);

  let admin = new PublicKey("6NKkyM14Q8DpPGBY6S5UXoy1arrPSrQ9a2vWErNzNm12");

  const addresses = csvData.map(
    (address: any) => new PublicKey(address.toString())
  );

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

  const storageRef = ref(
    storage,
    `teamImages/${lookupTableAddress.toBase58()}`
  );
  await uploadBytes(storageRef, teamImageFile);
  const teamImageUrl = await getDownloadURL(storageRef);

  const docRef = doc(db, "lookupTables", lookupTableAddress.toBase58());
  await setDoc(docRef, {
    lookupTableAddress: lookupTableAddress.toBase58(),
    transactionSignature: transactionSignature,
    teamName: teamName,
    teamDescription: teamDescription,
    teamImageUrl: teamImageUrl,
    teamAddress: teamAddress || null,
    teamHomepage: teamHomepage || null,
    createdAt: new Date(),
    githubUsername: githubUsername,
    whitelistId: whitelistId || null,
    creatorAddress: wallet.publicKey.toBase58(),
  });

  return {
    lookupTableAddress,
    transactionSignature,
  };
}
