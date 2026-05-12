export interface SendOtpResponse {
  requestId: string;
  expiresInSeconds: number;
}

export interface VerifyOtpResponse {
  token: string;
  expiresAt: number;
  isNew: boolean;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  phone: string;
  name?: string;
  businessName?: string;
  businessTypeId?: string;
  planId?: string;
  isOnboarded: boolean;
  createdAt: string;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  exp: number;
  iat: number;
}
