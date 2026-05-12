import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-qr-model',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './qr-model.html',
  styleUrl: './qr-model.scss',
})
export class QrModel implements OnDestroy {

  @Input() studentName = '';
  @Input() set qrObjectUrl(url: string | null) {
    this._qrObjectUrl = url;
  }
  get qrObjectUrl() { return this._qrObjectUrl; }

  @Input() isLoading = false;
  @Input() hasError  = false;

  @Output() closed = new EventEmitter<void>();

  private _qrObjectUrl: string | null = null;

  close() {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('qr-modal__backdrop')) {
      this.close();
    }
  }

  ngOnDestroy() {
    if (this._qrObjectUrl) {
      URL.revokeObjectURL(this._qrObjectUrl);
    }
  }
}