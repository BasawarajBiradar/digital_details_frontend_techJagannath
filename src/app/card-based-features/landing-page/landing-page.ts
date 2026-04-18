import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileApiService } from '@core/services/profile-api';
import { CardData } from '@core/services/profile-api';

export type AccountType = 'kids' | 'senior' | 'business' | 'vehicle' | 'pets' | 'social';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements OnInit {

  accountType = signal<AccountType | null>(null);
  profile = signal<any>(null);
  isLoading = signal(true);  // 👈 signal instead of boolean

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
    public router: Router
  ) {}

    ngOnInit() {
    const uid = this.route.snapshot.paramMap.get('uid');

    this.profileApi.retrieveUserCardDetails(uid).subscribe({
      next: (response) => {
        const type = response?.data?.accountType?.trim();
          if (this.isValidAccountType(type)) {
          this.accountType.set(type);        // 👈 .set()
          this.setProfileData(response.data);
          this.isLoading.set(false);          // 👈 .set()
          } else {
          this.isLoading.set(false);         // 👈 .set()
          this.router.navigate(['/registration/', uid]);
          }
      },
      error: (err) => {
          this.isLoading.set(false);         // 👈 .set()
        this.router.navigate(['/registration/', uid]);
      }
    });
  }

  private isValidAccountType(type: any): type is AccountType {
    return ['kids', 'senior', 'business', 'vehicle', 'pets', 'social'].includes(type);
  }

  get config() {
    return this.accountType() ? this.typeConfig[this.accountType()!] : null;
  }

private setProfileData(data: CardData) {
  switch (this.accountType()) {
    case 'kids':      this.profile.set(data.childProfile);    break; // ← was missing
    case 'senior':    this.profile.set(data.seniorProfile);   break;
    case 'business':  this.profile.set(data.businessProfile); break;
    case 'vehicle':   this.profile.set(data.vehicleProfile);  break;
    case 'pets':      this.profile.set(data.petProfile);      break;
    case 'social':    this.profile.set(data.socialProfile);   break;
  }
}

  // Helper
  entries(obj: any) {
    return Object.entries(obj || {});
  }
}