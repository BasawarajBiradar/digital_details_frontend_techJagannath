import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileApiService } from '@core/services/profile-api';

interface CardType {
  id: string;
  emoji: string;
  title: string;
  description: string;
  isActive: boolean;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  emailId: string;
  phoneNumber: string;
  alternateNumber?: string;
  addressLineOne: string;
  addressLineTwo?: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  safetyNote?: string;
  medicalNote?: string;
  cards: CardType[];
}

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  standalone: true,
  imports: [CommonModule],
})
export class HomePage implements OnInit {

  // ✅ Signals
  profile = signal<UserProfile | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  // Static card metadata
  private cardMeta = [
    { id: 'kids',     emoji: '👶', title: 'Kids',     description: 'Emergency info for children'  },
    { id: 'senior',   emoji: '👴', title: 'Senior',   description: 'Medical & contact details'    },
    { id: 'pets',     emoji: '🐾', title: 'Pets',     description: 'Pet ID & owner info'          },
    { id: 'business', emoji: '💼', title: 'Business', description: 'Card, links & company'        },
    { id: 'vehicle',  emoji: '🚗', title: 'Vehicle',  description: 'Car info & owner contact'     },
    { id: 'social',   emoji: '🌐', title: 'Social',   description: 'All your social links'        },
  ];

  constructor(
    private router: Router,
    private profileApi: ProfileApiService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.profileApi.getUserDetails().subscribe({
      next: (res) => {
        console.log('API SUCCESS', res);

        const apiCards: { id: string; isActive: boolean }[] = res.data.cards ?? [];

        const cards: CardType[] = this.cardMeta.map(meta => {
          const apiCard = apiCards.find(c => c.id === meta.id);
          return { ...meta, isActive: apiCard?.isActive ?? false };
        });

        this.profile.set({ ...res.data, cards });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('API ERROR', err);
        this.isLoading.set(false);
        this.loadError.set('Failed to load your profile. Please try again.');
      }
    });
  }

  navigateToCard(card: CardType) {
    if (!card.isActive) return;
    this.router.navigate(['/card', card.id]);
  }

  // ✅ computed signals
  fullAddress = computed(() => {
    const p = this.profile();
    if (!p) return '';

    return [
      p.addressLineOne,
      p.addressLineTwo,
      p.city,
      p.state,
      p.pinCode,
      p.country,
    ].filter(Boolean).join(', ');
  });

  activeCardCount = computed(() => {
    return this.profile()?.cards.filter(c => c.isActive).length ?? 0;
  });
}