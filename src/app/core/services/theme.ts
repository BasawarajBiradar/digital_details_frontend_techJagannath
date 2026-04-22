import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light-theme' | 'dark-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';
  private manuallySet = false;
  theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const body = document.body;
      body.classList.remove('light-theme', 'dark-theme');
      body.classList.add(this.theme());
    });

    // window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    //   if (!this.manuallySet) {
    //     this.theme.set(e.matches ? 'dark-theme' : 'light-theme');
    //   }
    // });
  }

  toggle() {
    this.manuallySet = true;
    this.theme.set(this.theme() === 'light-theme' ? 'dark-theme' : 'light-theme');
    localStorage.setItem(this.STORAGE_KEY, this.theme());
  }

  private getInitialTheme(): Theme {
    // const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
    // if (stored) {
    //   this.manuallySet = true;
    //   return stored;
    // }
    // try {
    //   return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-theme' : 'light-theme';
    // } catch {
    //   return 'light-theme';
    // }
    return 'light-theme';

  }
}