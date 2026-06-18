export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
  niche: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
}
