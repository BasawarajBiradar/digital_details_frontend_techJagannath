import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light-theme' | 'dark-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';
  theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const body = document.body;
      body.classList.remove('light-theme', 'dark-theme');
      body.classList.add(this.theme());
      localStorage.setItem(this.STORAGE_KEY, this.theme());
    });
  }

  toggle() {
    this.theme.set(this.theme() === 'light-theme' ? 'dark-theme' : 'light-theme');
  }

  private getInitialTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
    if (stored) return stored;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark-theme' : 'light-theme';
  }
}