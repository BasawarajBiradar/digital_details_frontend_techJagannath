import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FormStateService {
  commonFields = signal<Record<string, any>>({});

  save(values: Record<string, any>) {
    this.commonFields.set(values);
  }

  clear() {
    this.commonFields.set({});
  }
}