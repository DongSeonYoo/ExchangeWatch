export namespace IToken {
  export interface IAccessPayload {
    sub: string; // user identify
    email: string; // email
  }

  export interface IRefreshPayload {
    jti: string; // refresh token value
    sub: string; // user identify
  }
}
