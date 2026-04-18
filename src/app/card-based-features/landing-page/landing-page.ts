import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileApiService } from '@core/services/profile-api';

export type AccountType = 'kids' | 'senior' | 'business' | 'vehicle' | 'pets' | 'social';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements OnInit {

  accountType!: AccountType;
  profile: any;
  isLoading = true;

  readonly typeConfig: Record<AccountType, { title: string; subtitle: string; emoji: string }> = {
    kids:     { title: 'Child Profile',    subtitle: 'Emergency info for children',   emoji: '👶' },
    senior:   { title: 'Senior Profile',   subtitle: 'Medical & contact details',     emoji: '👴' },
    business: { title: 'Business Profile', subtitle: 'Company information',           emoji: '💼' },
    vehicle:  { title: 'Vehicle Profile',  subtitle: 'Vehicle & owner details',       emoji: '🚗' },
    pets:     { title: 'Pet Profile',      subtitle: 'Pet & owner details',           emoji: '🐾' },
    social:   { title: 'Social Profile',   subtitle: 'Social identity card',          emoji: '🌐' },
  };

  constructor(
    private route: ActivatedRoute,
    private profileApi: ProfileApiService,
    public router: Router,

  ) {}

    ngOnInit() {
    const uid = this.route.snapshot.paramMap.get('uid');

    this.profileApi.retrieveUserCardDetails(uid).subscribe({
      next: (response) => {
        const type = response?.data?.accountType;

        if (this.isValidAccountType(type)) {
          this.accountType = type;
        } else {
        this.router.navigate(['/registration/', uid]);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Registration failed', err);
        this.router.navigate(['/registration/', uid]);
      }
    });
  }

  private isValidAccountType(type: any): type is AccountType {
    return ['kids', 'senior', 'business', 'vehicle', 'pets', 'social'].includes(type);
  }

  get config() {
    return this.typeConfig[this.accountType];
  }

  // Helper
  entries(obj: any) {
    return Object.entries(obj || {});
  }
}