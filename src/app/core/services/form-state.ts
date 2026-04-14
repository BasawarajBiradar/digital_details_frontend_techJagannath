import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FormStateService {
  commonFields = signal<Record<string, any>>({});
  private _userId = signal<number | null>(null);

  save(values: Record<string, any>) {
    this.commonFields.set(values);
  }

  setUserId(id: number) {
    this._userId.set(id);
  }

  getUserId(): number | null {
    return this._userId();
  }

  clear() {
    this.commonFields.set({});
    this._userId.set(null);
  }
}