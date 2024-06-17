export interface Application {
  id: string;
  projectName: string;
  hpAddress: string;
  projectDescription: string;
  contactName: string;
  contactEmail: string;
  walletAddress: string;
  submittedAt: {
    seconds: number;
    nanoseconds: number;
  };
  status: string;
}
