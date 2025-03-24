import { SocialProvider } from '../../auth/constant/auth.contant';

export namespace IUser {
  export interface ICreateBySocial {
    email: string;
    name: string;
    password: string;
    socialId: string;
    socialProvider: SocialProvider;
  }

  export interface IDecoded {
    idx: number;
    email: string;
  }
}
