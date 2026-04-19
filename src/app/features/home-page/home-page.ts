import { Component, OnInit } from '@angular/core';
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
  profile: UserProfile | null = null;
  isLoading = true;
  loadError: string | null = null;

  // Static card metadata — isActive will be merged from API response
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
    this.isLoading = true;
    this.loadError = null;

    this.profileApi.getUserDetails().subscribe({
      next: (res) => {
        const apiCards: { id: string; isActive: boolean }[] = res.data.cards ?? [];

        const cards: CardType[] = this.cardMeta.map(meta => {
          const apiCard = apiCards.find(c => c.id === meta.id);
          return { ...meta, isActive: apiCard?.isActive ?? false };
        });

        this.profile = { ...res.data, cards };
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = 'Failed to load your profile. Please try again.';
        console.error('Load failed:', err);
      }
    });
  }

  navigateToCard(card: CardType) {
    if (!card.isActive) return;
    this.router.navigate(['/card', card.id]);
  }

  get fullAddress(): string {
    if (!this.profile) return '';
    const parts = [
      this.profile.addressLineOne,
      this.profile.addressLineTwo,
      this.profile.city,
      this.profile.state,
      this.profile.pinCode,
      this.profile.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  get activeCardCount(): number {
    return this.profile?.cards.filter(c => c.isActive).length ?? 0;
  }
}
