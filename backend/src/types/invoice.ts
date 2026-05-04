export interface Invoice {
  id: string;
  owner: string;
  amount: number;
  currency: string;
  dueDate: string;
  debtorName: string;
  ipfsHash?: string;
  riskScore?: number;
  status: "pending" | "funded" | "repaid" | "defaulted";
  createdAt: string;
}
