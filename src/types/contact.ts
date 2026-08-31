export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  ip?: string;
  createdAt: number;
  sent: boolean;
}
