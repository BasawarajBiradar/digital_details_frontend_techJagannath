import { NgOptimizedImage } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';

export interface NavbarItem {
  label: string;
  route: string | readonly string[];
  icon?: string;
  exact?: boolean;
  visible?: boolean;
}

@Component({
  selector: 'app-navbar',
  imports: [MatButtonModule, MatIconModule, NgOptimizedImage, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  readonly showBack = input(false);
  readonly backFallback = input<string | readonly string[]>('/');
  readonly items = input<readonly NavbarItem[]>([]);
  readonly menuOpen = signal(false);

  constructor(
    private readonly location: Location,
    private readonly router: Router,
  ) {}

  navigateBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(Array.isArray(this.backFallback())
      ? this.backFallback() as string[]
      : [this.backFallback() as string]);
  }

  toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}