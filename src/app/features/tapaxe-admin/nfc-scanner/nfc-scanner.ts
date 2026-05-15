import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NfcService, NfcScanResult } from '../services/nfc-service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-nfc-scanner',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatCardModule,
    MatProgressSpinnerModule, MatIconModule
  ],
  templateUrl: './nfc-scanner.html',
  styleUrl: './nfc-scanner.scss',
})
export class NfcScanner implements OnDestroy {
  isScanning = false;
  isSupported: boolean;
  errorMessage: string | null = null;
  scanHistory: NfcScanResult[] = [];

  private scanSubscription?: Subscription;

  constructor(private nfcService: NfcService) {
    this.isSupported = this.nfcService.isSupported();
  }

  startScan(): void {
    this.errorMessage = null;
    this.isScanning = true;

    this.scanSubscription = this.nfcService.scanCard().subscribe({
      next: (result: NfcScanResult) => {
        // Prepend so latest scan appears at the top
        this.scanHistory = [result, ...this.scanHistory];
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

  ngOnDestroy(): void {
    this.stopScan();
  }
}