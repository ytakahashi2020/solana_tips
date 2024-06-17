// types/transfer.ts
export interface Transfer {
  id: string;
  recipient: string;
  amount: number;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
  message?: string;
}
