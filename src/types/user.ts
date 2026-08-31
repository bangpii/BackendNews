export interface GuestUserInput {
  name?: string;
  role?: string;
}

export interface StoredUser {
  id: string;
  ip: string;
  name: string;
  role: string;
  avatarHue: number;
  anonymous: boolean;
  lastSeenAt: number;
  createdAt: number;
}
