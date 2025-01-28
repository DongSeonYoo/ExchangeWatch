export namespace IToken {
  export interface IAccessPayload {
    sub: string; // user identify
    email: string; // email
  }

  export interface IRefreshPayload {
    sub: string; // user identify
  }
}
