import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription, take } from 'rxjs';
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
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './nfc-scanner.html',
  styleUrl: './nfc-scanner.scss',
})
export class NfcScanner implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly nfcService = inject(NfcService);

  readonly isStandalone = signal(false);
  readonly isSupported = signal(false);
  readonly isScanning = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Manual UID Fallback state
  readonly manualUid = signal('');
  readonly manualError = signal<string | null>(null);
  readonly isManualSubmitting = signal(false);

  // Scan & Provisioning History
  scanHistory: NfcScanResult[] = [];
  copiedIndex: number | null = null;

  private scanSubscription?: Subscription;

  ngOnInit(): void {
    this.isSupported.set(this.nfcService.isSupported());
    this.isStandalone.set(this.router.url.includes('/nfc-scanner'));
  }

  // ── Normalize UID Helper ───────────────────────────────────────────────────
  normalizeUid(raw: string): string {
    return raw.replace(/[:\s-]/g, '').toUpperCase();
  }

  // ── Physical NFC Scan Flow ─────────────────────────────────────────────────
  startScan(): void {
    this.errorMessage.set(null);
    this.isScanning.set(true);

    this.scanSubscription = this.nfcService.scanCard()
      .pipe(take(1))
      .subscribe({
        next: (result: NfcScanResult) => {
          this.isScanning.set(false);
          const normalizedSerial = this.normalizeUid(result.serialNumber);

          const entry: NfcScanResult = {
            serialNumber: normalizedSerial,
            scannedAt: result.scannedAt,
            saving: true,
            method: 'nfc'
          };
          this.scanHistory = [entry, ...this.scanHistory];

          this.nfcService.saveUid(normalizedSerial).subscribe({
            next: (res) => {
              this.scanHistory = this.scanHistory.map(s =>
                s.serialNumber === normalizedSerial && s.scannedAt === result.scannedAt
                  ? { ...s, saving: false, url: res.data?.url }
                  : s
              );
            },
            error: (err) => {
              this.scanHistory = this.scanHistory.map(s =>
                s.serialNumber === normalizedSerial && s.scannedAt === result.scannedAt
                  ? { ...s, saving: false, saveError: err?.error?.message || err.message || 'Failed to save UID.' }
                  : s
              );
            }
          });
        },
        error: (err) => {
          this.isScanning.set(false);
          this.errorMessage.set(err.message || 'NFC hardware read failed. Please tap again.');
        }
      });
  }

  stopScan(): void {
    this.scanSubscription?.unsubscribe();
    this.isScanning.set(false);
  }

  // ── Manual UID Fallback Flow ───────────────────────────────────────────────
  onManualInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/[^a-fA-F0-9:\s-]/g, '');
    input.value = clean;
    this.manualUid.set(clean);
    this.manualError.set(null);
  }

  submitManualUid(): void {
    const raw = this.manualUid().trim();
    const normalized = this.normalizeUid(raw);

    if (!normalized) {
      this.manualError.set('Please enter a valid card UID.');
      return;
    }

    if (normalized.length < 8 || normalized.length > 28) {
      this.manualError.set('Invalid UID length. Standard NFC UIDs are between 8 and 28 hexadecimal characters (4 to 14 bytes).');
      return;
    }

    this.manualError.set(null);
    this.isManualSubmitting.set(true);

    const scannedAt = new Date().toISOString();
    const entry: NfcScanResult = {
      serialNumber: normalized,
      scannedAt,
      saving: true,
      method: 'manual'
    };
    this.scanHistory = [entry, ...this.scanHistory];

    this.nfcService.saveUid(normalized).subscribe({
      next: (res) => {
        this.isManualSubmitting.set(false);
        this.manualUid.set('');
        this.scanHistory = this.scanHistory.map(s =>
          s.serialNumber === normalized && s.scannedAt === scannedAt
            ? { ...s, saving: false, url: res.data?.url }
            : s
        );
      },
      error: (err) => {
        this.isManualSubmitting.set(false);
        const msg = err?.error?.message || err?.message || 'Failed to save UID to database.';
        this.manualError.set(msg);
        this.scanHistory = this.scanHistory.map(s =>
          s.serialNumber === normalized && s.scannedAt === scannedAt
            ? { ...s, saving: false, saveError: msg }
            : s
        );
      }
    });
  }

  // ── History & Utility ───────────────────────────────────────────────────────
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
