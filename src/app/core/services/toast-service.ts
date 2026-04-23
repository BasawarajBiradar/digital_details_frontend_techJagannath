import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private base: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
  };

  constructor(private snackBar: MatSnackBar) {}

  success(message: string) {
    this.snackBar.open(message, '✕', {
      ...this.base,
      panelClass: ['toast', 'toast--success'],
    });
  }

  error(message: string) {
    this.snackBar.open(message, '✕', {
      ...this.base,
      duration: 6000, // errors stay longer
      panelClass: ['toast', 'toast--error'],
    });
  }

  info(message: string) {
    this.snackBar.open(message, '✕', {
      ...this.base,
      panelClass: ['toast', 'toast--info'],
    });
  }
}