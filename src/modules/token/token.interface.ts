export namespace IToken {
  export interface IAccessPayload {
    sub: number; // user identify
    email: string; // email
  }

  export interface IRefreshPayload {
    sub: number; // user identify
  }
}
