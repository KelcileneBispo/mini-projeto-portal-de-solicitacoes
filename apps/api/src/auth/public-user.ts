export type PublicUser = {
  id: number;
  name: string;
  username: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: PublicUser;
};
