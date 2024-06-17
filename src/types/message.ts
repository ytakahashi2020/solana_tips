export interface Message {
  sender: string;
  message: string;
  timestamp: { seconds: number; nanoseconds: number };
}
