import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, take} from 'rxjs';
import { NfcService, NfcScanResult } from '../services/nfc-service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-nfc-scanner',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatCardModule,
    MatProgressSpinnerModule, MatIconModule, MatTooltipModule
  ],
  templateUrl: './nfc-scanner.html',
  styleUrl: './nfc-scanner.scss',
})
export class NfcScanner implements OnDestroy {
  isScanning = false;
  isSupported: boolean;
  errorMessage: string | null = null;
  scanHistory: NfcScanResult[] = [];
  copiedIndex: number | null = null;

  private scanSubscription?: Subscription;

  constructor(private nfcService: NfcService) {
    this.isSupported = this.nfcService.isSupported();
  }

  startScan(): void {
    this.errorMessage = null;
    this.isScanning = true;

    this.scanSubscription = this.nfcService.scanCard()
      .pipe(take(1))                           // ← auto-cut after first scan
      .subscribe({
        next: (result: NfcScanResult) => {
          this.isScanning = false;             // ← stop the scanning indicator

          const entry: NfcScanResult = { ...result, saving: true };
          this.scanHistory = [entry, ...this.scanHistory];

          this.nfcService.saveUid(result.serialNumber).subscribe({
            next: (res) => {
              this.scanHistory = this.scanHistory.map(s =>
                s.serialNumber === result.serialNumber && s.scannedAt === result.scannedAt
                  ? { ...s, saving: false, url: res.data?.url }
                  : s
              );
            },
            error: (err) => {
              this.scanHistory = this.scanHistory.map(s =>
                s.serialNumber === result.serialNumber && s.scannedAt === result.scannedAt
                  ? { ...s, saving: false, saveError: err.message || 'Failed to save UID.' }
                  : s
              );
            }
          });
        },
        error: (err) => {
          this.isScanning = false;
          this.errorMessage = err.message || 'Scan failed.';
        }
      });
  }

  stopScan(): void {
    this.scanSubscription?.unsubscribe();
    this.isScanning = false;
  }

  clearHistory(): void {
    this.scanHistory = [];
  }

  copyUrl(url: string, index: number): void {
    navigator.clipboard.writeText(url).then(() => {
      this.copiedIndex = index;
      setTimeout(() => this.copiedIndex = null, 2000);
    });
  }

  ngOnDestroy(): void {
    this.stopScan();
  }
}