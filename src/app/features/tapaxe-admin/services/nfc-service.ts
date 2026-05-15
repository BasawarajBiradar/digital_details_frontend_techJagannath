import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

export interface NfcScanResult {
  serialNumber: string;
  scannedAt: string;
}

@Injectable({ providedIn: 'root' })
export class NfcService {

  isSupported(): boolean {
    return 'NDEFReader' in window;
  }

  scanCard(): Observable<NfcScanResult> {
    if (!this.isSupported()) {
      return throwError(() => new Error('Web NFC is not supported on this device/browser.'));
    }

    return new Observable(observer => {
      const controller = new AbortController();

      (async () => {
        try {
          const reader = new (window as any).NDEFReader();
          await reader.scan({ signal: controller.signal });

          reader.addEventListener('reading', (event: any) => {
            observer.next({
              serialNumber: event.serialNumber,
              scannedAt: new Date().toISOString(),
            });
          });

          reader.addEventListener('readingerror', () => {
            observer.error(new Error('Could not read NFC card. Try again.'));
          });

        } catch (err: any) {
          if (err.name === 'AbortError') return;
          observer.error(err);
        }
      })();

      return () => controller.abort();
    });
  }
}