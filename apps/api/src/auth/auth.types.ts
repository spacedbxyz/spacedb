import type { UserRole } from '@spacedb/contract';

export type Principal = { id: string; role: UserRole };

export type IssuedTokens = {
  accessToken: string;
  accessExpiresIn: number;
  refreshPlaintext: string;
  refreshExpiresIn: number;
};
