// mypage/hooks/useUserProfile.ts
import { useEffect, useState } from "react";
import {
  getUserProfile,
  getTransferHistory,
  getMonthlyTotal,
} from "../../../../components/utils";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Profile } from "../../../../types/profile";
import { Transfer } from "../../../../types/transfer";

interface UserProfile {
  profile: Profile;
  transferHistory: any[]; // 適切な型を定義してください
  totalAmount: number;
  monthlyTotal: number;
  profileLoaded: boolean;
  isRegistered: boolean;
  setProfile: (profile: Profile) => void;
}
export const useUserProfile = (
  wallet: AnchorWallet | undefined
): UserProfile => {
  const [profile, setProfile] = useState<Profile>({
    name: "",
    description: "",
    imageUrl: "",
  });
  const [transferHistory, setTransferHistory] = useState<Transfer[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (wallet) {
        const userAddress = wallet.publicKey.toBase58();
        const profileData = await getUserProfile(userAddress);
        if (profileData) {
          setProfile(profileData as Profile);
          setIsRegistered(true);
        }
        setProfileLoaded(true);
      }
    };

    const fetchTransferHistory = async () => {
      if (wallet) {
        const userAddress = wallet.publicKey.toBase58();
        const history = await getTransferHistory(userAddress);
        setTransferHistory(history);

        const total = history.reduce(
          (sum, transfer) => sum + (transfer.amount || 0),
          0
        );
        setTotalAmount(parseFloat(total.toFixed(3)));

        const monthlyTotal = await getMonthlyTotal(userAddress);
        setMonthlyTotal(monthlyTotal);
      }
    };

    fetchUserProfile();
    fetchTransferHistory();
  }, [wallet]);

  return {
    profile,
    transferHistory,
    totalAmount,
    monthlyTotal,
    profileLoaded,
    isRegistered,
    setProfile,
  };
};
