export interface UserDto {
  username: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  username: string;
  user: UserDto;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  name?: string;
}

/** Raw response of /api/auth/login, /register and /refresh. */
export interface TokenResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  role?: string;
  username?: string;
  name?: string;
  email?: string;
  user?: UserDto;
}

export interface ServerAuthResponse {
  token?: string;
  role?: string;
  username?: string;
  name?: string;
  email?: string;
  user?: UserDto;
  message?: string;
}
