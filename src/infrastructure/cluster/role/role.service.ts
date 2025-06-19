import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleService {
  private _isLeader = false;

  /**
   * Check if the instance is leader
   */
  public get isLeader(): boolean {
    return this._isLeader;
  }

  /**
   * Set the current instance role as leader
   */
  public setAsLeader(): void {
    this._isLeader = true;
  }

  /**
   * Set the current instance role as worker
   */
  public setAsWorker(): void {
    this._isLeader = false;
  }
}
