import {
  PublicKey,
  Connection,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Program, Idl, AnchorProvider } from "@coral-xyz/anchor";
// import IDL_pyusd from "../idl.json";
import IDL_pyusd from "../types/idl_pyusd";
import IDL_pyusd_test from "../types/idl_pyusd_test";
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import BN from "bn.js";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
  orderBy,
  arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  programId_pyusd,
  programId_pyusd_test,
  MINT_ADDRESS,
} from "../app/[lng]/[lookupTableAddress]/constants";

import { keypairIdentity, generateSigner } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createV1 } from "@metaplex-foundation/mpl-core";
import { Keypair } from "@solana/web3.js";
import { Application } from "../types/application";
import { Transfer } from "../types/transfer";
import { Profile } from "../types/profile";
import { Donation } from "../types/donation";
import { MonthlyTotal } from "../types/monthlyTotal";
import { Message } from "../types/message";
import { Member } from "../types/member";

export function createProvider(wallet: AnchorWallet, connection: Connection) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  // const provider = new Provider(connection, wallet, {
  //   preflightCommitment: "recent",
  // });

  anchor.setProvider(provider);
  return provider;
}

export function createTransaction() {
  const transaction = new Transaction();
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 200000, // 必要なユニット数（必要に応じて調整）
    })
  );
  return transaction;
}

export async function createAssociatedTokenAccounts(
  wallet: AnchorWallet,
  connection: Connection,
  recipientAddresses: string[]
) {
  const instructions = [];
  const recipientAtas = [];

  for (const addr of recipientAddresses) {
    const associatedToken = getAssociatedTokenAddressSync(
      MINT_ADDRESS,
      new PublicKey(addr),
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const instruction = createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      associatedToken,
      new PublicKey(addr),
      MINT_ADDRESS,
      TOKEN_2022_PROGRAM_ID
    );
    instructions.push(instruction);
    recipientAtas.push(associatedToken);
    console.log(`created token account for address ${addr}`);
  }

  return { instructions, recipientAtas };
}

export async function fetchBalance(
  wallet: AnchorWallet,
  connection: Connection
) {
  if (wallet) {
    try {
      const associatedToken = getAssociatedTokenAddressSync(
        MINT_ADDRESS,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const tokenAccountBalance = await connection.getTokenAccountBalance(
        associatedToken
      );
      return tokenAccountBalance.value.uiAmount;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return null;
    }
  }
  return null;
}

export async function handleSupportClick(
  amount: number,
  connection: Connection,
  wallet: AnchorWallet,
  setAddresses: React.Dispatch<React.SetStateAction<string[]>>,
  fetchBalance: () => Promise<void>,
  lookupTableAddress: string
): Promise<string | null> {
  // トランザクションIDを返すために型を変更
  console.log("Support clicked");

  const lookupTablePublicKey = new PublicKey(lookupTableAddress);

  const lookupTableResult = await connection.getAddressLookupTable(
    lookupTablePublicKey
  );

  if (!lookupTableResult.value) {
    console.error("Lookup table not found or could not be loaded.");
    return null; // エラー時はnullを返す
  }

  const lookupTableAccount = lookupTableResult.value;
  console.log("Table address from cluster:", lookupTableAccount);

  const newAddresses = lookupTableAccount.state.addresses.map((address) =>
    address.toBase58()
  );
  setAddresses((prevAddresses) => [...prevAddresses, ...newAddresses]);

  newAddresses.forEach((address, index) => {
    console.log(index, address);
  });

  const amountPerAddress = amount / newAddresses.length;
  console.log("amountPerAddress", amountPerAddress);

  const roundedAmountPerAddress = Math.round(amountPerAddress * 1000) / 1000;
  console.log("roundedAmountPerAddress", roundedAmountPerAddress);

  const associatedToken = getAssociatedTokenAddressSync(
    MINT_ADDRESS,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  console.log("associatedToken", associatedToken.toString());

  const provider = createProvider(wallet, connection);
  const program = new Program(
    IDL_pyusd_test,
    programId_pyusd_test.toBase58(),
    provider
  );

  const transaction = createTransaction();

  const senderAtaInstruction =
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      associatedToken,
      wallet.publicKey,
      MINT_ADDRESS,
      TOKEN_2022_PROGRAM_ID
    );
  transaction.add(senderAtaInstruction);

  const decimals = 6;
  const toamount = new BN(roundedAmountPerAddress * Math.pow(10, decimals));

  const { instructions: recipientAtaInstructions, recipientAtas } =
    await createAssociatedTokenAccounts(wallet, connection, newAddresses);

  recipientAtaInstructions.forEach((instruction) =>
    transaction.add(instruction)
  );

  const destinationAtas = recipientAtas.map((addr) => ({
    pubkey: new PublicKey(addr),
    isSigner: false,
    isWritable: true,
  }));

  transaction.add(
    await program.methods
      .sendToAll(toamount)
      .accounts({
        from: associatedToken,
        authority: wallet.publicKey,
        mint: MINT_ADDRESS,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .remainingAccounts(destinationAtas)
      .instruction()
  );

  try {
    const tx = await provider.sendAndConfirm(transaction);
    console.log("tx", tx);

    setAddresses([]);
    await fetchBalance(); // 残高を更新

    return tx; // トランザクションIDを返す
  } catch (error) {
    console.error("Transaction failed", error);
    return null; // エラー時はnullを返す
  }
}

export const saveTransferHistory = async (
  sender: string,
  recipient: string,
  amount: number,
  message?: string
): Promise<void> => {
  try {
    await addDoc(collection(db, "transferHistory"), {
      sender,
      recipient,
      amount: parseFloat(amount.toString()),
      timestamp: new Date(),
      message,
    });
    console.log("Document written with ID: ", recipient);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

export async function getTransferHistory(
  userAddress: string
): Promise<Transfer[]> {
  const transferHistoryRef = collection(db, "transferHistory");
  const q = query(
    transferHistoryRef,
    where("sender", "==", userAddress),
    orderBy("timestamp", "desc")
  );
  const querySnapshot = await getDocs(q);

  const transferHistory: Transfer[] = [];
  querySnapshot.forEach((doc) => {
    transferHistory.push({ id: doc.id, ...doc.data() } as Transfer);
  });

  return transferHistory;
}
export async function saveUserProfile(
  userId: string,
  name: string,
  description: string,
  imageUrl: string
): Promise<void> {
  try {
    await setDoc(doc(db, "users", userId), {
      userId, // ウォレットアドレスも保存
      name,
      description,
      imageUrl,
    });
    console.log("User profile saved");
  } catch (e) {
    console.error("Error saving user profile: ", e);
  }
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as Profile;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (e) {
    console.error("Error getting user profile: ", e);
    return null;
  }
}

export async function getMonthlyTotal(userAddress: string): Promise<number> {
  const transferHistoryRef = collection(db, "transferHistory");
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );

  const q = query(
    transferHistoryRef,
    where("sender", "==", userAddress),
    where("timestamp", ">=", Timestamp.fromDate(startOfMonth)),
    where("timestamp", "<=", Timestamp.fromDate(endOfMonth))
  );

  const querySnapshot = await getDocs(q);

  let monthlyTotal = 0;
  querySnapshot.forEach((doc) => {
    monthlyTotal += doc.data().amount;
  });

  return monthlyTotal;
}

export async function saveApplication(
  data: Omit<Application, "id">
): Promise<void> {
  try {
    const docRef = await addDoc(collection(db, "applications"), data);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export async function getAdminAddresses(): Promise<string[]> {
  const adminRef = collection(db, "adminAddresses");
  const adminSnapshot = await getDocs(adminRef);
  return adminSnapshot.docs.map((doc) => doc.data().address);
}

export async function getApplications(): Promise<Application[]> {
  const applicationsRef = collection(db, "applications");
  const applicationsSnapshot = await getDocs(applicationsRef);
  return applicationsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      projectName: data.projectName,
      hpAddress: data.hpAddress,
      projectDescription: data.projectDescription,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      walletAddress: data.walletAddress,
      submittedAt: data.submittedAt,
      status: data.status,
    } as Application;
  });
}

export async function updateApplicationStatus(
  id: string,
  status: string
): Promise<void> {
  const applicationRef = doc(db, "applications", id);
  await updateDoc(applicationRef, { status });
}

export async function saveDataAsJSON(
  profile: Profile,
  transferHistory: Transfer[],
  totalAmount: number
): Promise<void> {
  const data = {
    name: profile.name,
    symbol: profile.name,
    description: profile.description,
    image: profile.imageUrl,
    attributes: [
      { trait_type: "totalAmount", value: totalAmount.toString() },
      ...transferHistory.map((transfer, index) => ({
        trait_type: `recipient${index + 1}`,
        value: transfer.recipient,
      })),
    ],
  };

  const jsonString = JSON.stringify(data);
  const blob = new Blob([jsonString], { type: "application/json" });
  const storageRef = ref(storage, "test.json");

  try {
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "savedDataURLs"), {
      url: url,
      createdAt: new Date(),
    });

    console.log("JSON file uploaded and URL saved successfully");
  } catch (error) {
    console.error("Error uploading JSON file: ", error);
  }
}

export const saveDataToAkord = async (data: object): Promise<string> => {
  try {
    const akordApiKey = process.env.NEXT_PUBLIC_AKORD_API_KEY;
    if (!akordApiKey) {
      throw new Error("Akord API key not found in environment variables.");
    }
    const jsonString = JSON.stringify(data);
    const response = await fetch("https://api.akord.com/files", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Api-Key": akordApiKey,
        "Content-Type": "text/plain",
      },
      body: jsonString,
    });

    if (response.ok) {
      const responseData = await response.json();
      const txId = responseData.tx.id; // Akordから返されたtxのIDを取得
      return txId;
    } else {
      throw new Error("Failed to upload data to Akord");
    }
  } catch (error) {
    console.error("Error uploading JSON file to Akord:", error);
    throw error;
  }
};

export const saveDataURLToFirestore = async (tokenID: string) => {
  try {
    const docRef = doc(db, "tokens", tokenID);
    await setDoc(docRef, {
      tokenID: tokenID,
      explorerURL: `https://core.metaplex.com/explorer/${tokenID}?env=devnet`,
    });
    console.log("Document written with ID: ", tokenID);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

export const createNFT = async (
  txId: string,
  saveToFirestore: boolean = true
) => {
  const endpoint = "https://api.devnet.solana.com";
  const umi = createUmi(endpoint);

  const payerSecretKey = process.env.NEXT_PUBLIC_PAYER_SECRET_KEY;
  if (!payerSecretKey) {
    throw new Error("payerSecretKey not found in environment variables.");
  }
  const secretKeyUInt8Array = new Uint8Array(JSON.parse(payerSecretKey));
  const payerKeypair =
    umi.eddsa.createKeypairFromSecretKey(secretKeyUInt8Array);
  umi.use(keypairIdentity(payerKeypair));

  const asset = generateSigner(umi);
  const uri = `https://arweave.net/${txId}`;

  const creatingResult = await createV1(umi, {
    asset,
    name: "My Core NFT",
    uri: uri,
  }).sendAndConfirm(umi);

  console.log("payer =>", payerKeypair.publicKey.toString());
  console.log("asset =>", asset.publicKey.toString());

  const tokenID = asset.publicKey.toString();
  if (saveToFirestore) {
    await saveDataURLToFirestore(tokenID);
  }
  return tokenID;
};

export const createNFTUsingAkord = async (
  data: object,
  saveToFirestore: boolean = true
) => {
  try {
    const txId = await saveDataToAkord(data);
    const tokenID = await createNFT(txId, saveToFirestore);
    return tokenID;
  } catch (error) {
    console.error("Error creating NFT using Akord:", error);
    throw error;
  }
};

export async function getDonationsForProject(
  lookupTableAddress: string
): Promise<Donation[]> {
  const donationsRef = collection(db, "transferHistory");
  const q = query(donationsRef, where("recipient", "==", lookupTableAddress));
  const querySnapshot = await getDocs(q);

  const donations: Donation[] = [];
  querySnapshot.forEach((doc) => {
    donations.push(doc.data() as Donation);
  });

  return donations;
}

export async function getProjectDonationStats(
  lookupTableAddress: string
): Promise<{ donorCount: number; totalAmount: number }> {
  const donations = await getDonationsForProject(lookupTableAddress);
  const donorSet = new Set<string>();
  let totalAmount = 0;

  donations.forEach((donation) => {
    donorSet.add(donation.sender);
    totalAmount += donation.amount;
  });

  return { donorCount: donorSet.size, totalAmount };
}

export async function getTopMonthlySenders(): Promise<MonthlyTotal[]> {
  const transferHistoryRef = collection(db, "transferHistory");
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );

  const q = query(
    transferHistoryRef,
    where("timestamp", ">=", Timestamp.fromDate(startOfMonth)),
    where("timestamp", "<=", Timestamp.fromDate(endOfMonth))
  );

  const querySnapshot = await getDocs(q);

  const monthlyTotals: { [sender: string]: number } = {};

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const sender = data.sender;
    const amount = data.amount;

    if (!monthlyTotals[sender]) {
      monthlyTotals[sender] = 0;
    }

    monthlyTotals[sender] += amount;
  });

  const monthlyTotalsArray: MonthlyTotal[] = Object.keys(monthlyTotals).map(
    (sender) => ({
      sender,
      totalAmount: monthlyTotals[sender],
    })
  );

  // 上位10名を取得
  monthlyTotalsArray.sort((a, b) => b.totalAmount - a.totalAmount);
  return monthlyTotalsArray.slice(0, 10);
}

export async function getAllMonthlySenders(): Promise<MonthlyTotal[]> {
  const transferHistoryRef = collection(db, "transferHistory");
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );

  const q = query(
    transferHistoryRef,
    where("timestamp", ">=", Timestamp.fromDate(startOfMonth)),
    where("timestamp", "<=", Timestamp.fromDate(endOfMonth))
  );

  const querySnapshot = await getDocs(q);

  const monthlyTotals: { [sender: string]: number } = {};

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const sender = data.sender;
    const amount = data.amount;

    if (!monthlyTotals[sender]) {
      monthlyTotals[sender] = 0;
    }

    monthlyTotals[sender] += amount;
  });

  const monthlyTotalsArray: MonthlyTotal[] = Object.keys(monthlyTotals).map(
    (sender) => ({
      sender,
      totalAmount: monthlyTotals[sender],
    })
  );

  return monthlyTotalsArray;
}

export const saveWinnerDataToFirestore = async (
  tokenID: string,
  winner: string,
  month: string
) => {
  try {
    const docRef = doc(db, "winnerNFTs", tokenID);
    await setDoc(docRef, {
      tokenID: tokenID,
      winner: winner,
      month: month,
      explorerURL: `https://core.metaplex.com/explorer/${tokenID}?env=devnet`,
    });
    console.log("Winner NFT Document written with ID: ", tokenID);
  } catch (error) {
    console.error("Error adding winner NFT document: ", error);
  }
};

export const saveSupportMessage = async (
  sender: string,
  recipient: string,
  message: string
) => {
  try {
    await addDoc(collection(db, "supportMessages"), {
      sender,
      recipient,
      message,
      timestamp: new Date(),
    });
    console.log("Support message saved successfully.");
  } catch (error) {
    console.error("Error saving support message: ", error);
  }
};

export const getMessagesForPost = async (
  lookupTableAddress: string
): Promise<Message[]> => {
  const messagesRef = collection(db, "transferHistory");
  const q = query(messagesRef, where("recipient", "==", lookupTableAddress));
  const querySnapshot = await getDocs(q);

  const messages: Message[] = querySnapshot.docs
    .map((doc) => doc.data() as Message)
    .filter((data) => data.message); // メッセージがあるものだけをフィルタリング

  return messages;
};

export const addMember = async (lookupTableAddress: string, member: Member) => {
  const membersCollectionRef = collection(
    db,
    "lookupTables",
    lookupTableAddress,
    "members"
  );
  await addDoc(membersCollectionRef, member);
};

export const getMembers = async (
  lookupTableAddress: string
): Promise<Member[]> => {
  const membersCollectionRef = collection(
    db,
    "lookupTables",
    lookupTableAddress,
    "members"
  );
  const querySnapshot = await getDocs(membersCollectionRef);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Member[];
};

export const getCreatorAddress = async (
  lookupTableAddress: string
): Promise<string | null> => {
  try {
    const docRef = doc(db, "lookupTables", lookupTableAddress);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.creatorAddress || null;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting creator address: ", error);
    return null;
  }
};

export const getUserName = async (userId: string): Promise<string | null> => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.name || null;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting user name: ", error);
    return null;
  }
};

export const getProjectName = async (
  lookupTableAddress: string
): Promise<string | null> => {
  try {
    const docRef = doc(db, "lookupTables", lookupTableAddress);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.teamName || null;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting project name: ", error);
    return null;
  }
};

export const getLookuptableAddresses = async (
  creatorAddress: string
): Promise<string[]> => {
  try {
    const q = query(
      collection(db, "lookupTables"),
      where("creatorAddress", "==", creatorAddress)
    );
    const querySnapshot = await getDocs(q);
    const lookupTableAddresses: string[] = [];
    querySnapshot.forEach((doc) => {
      lookupTableAddresses.push(doc.data().lookupTableAddress);
    });
    return lookupTableAddresses;
  } catch (error) {
    console.error("Error getting lookup table addresses: ", error);
    return [];
  }
};

export const getMessagesForLookupTables = async (
  lookupTableAddresses: string[]
): Promise<any[]> => {
  // 型は適宜修正してください
  try {
    const messages: any[] = [];
    const q = query(
      collection(db, "supportMessages"),
      where("recipient", "in", lookupTableAddresses)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      messages.push(doc.data());
    });
    return messages;
  } catch (error) {
    console.error("Error getting messages for lookup tables: ", error);
    return [];
  }
};

export const getProjectMemberCount = async (
  lookupTableAddress: string
): Promise<number> => {
  try {
    const membersCollectionRef = collection(
      db,
      "lookupTables",
      lookupTableAddress,
      "members"
    );
    const querySnapshot = await getDocs(membersCollectionRef);
    return querySnapshot.size; // ドキュメントの数を返す
  } catch (error) {
    console.error("Error getting project member count: ", error);
    return 0;
  }
};
