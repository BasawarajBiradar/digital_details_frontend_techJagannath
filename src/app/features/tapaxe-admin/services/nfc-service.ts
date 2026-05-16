import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

export interface NfcScanResult {
  serialNumber: string;
  scannedAt: string;
  url?: string;
  saving?: boolean;
  saveError?: string;
}

interface AddNfcUidResponse {
  success: boolean;
  message: string;
  code: string;
  data: { url: string };
  errors: null | string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class NfcService {

  private readonly API_URL = `${environment.apiUrl}/api/tapaxe-admin/add-nfc-uid`;

  constructor(private http: HttpClient) {}

  isSupported(): boolean {
    return 'NDEFReader' in window;
  }

  saveUid(uid: string): Observable<AddNfcUidResponse> {
    return this.http.post<AddNfcUidResponse>(this.API_URL, { uid });
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
            controller.abort();
            observer.complete();
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