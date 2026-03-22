import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface CardType {
  id: string;
  emoji: string;
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-setup-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setup-card.html',
  styleUrl: './setup-card.scss'
})
export class SetupCardComponent {
  selectedCard: string | null = null;

  cards: CardType[] = [
    { id: 'kids',     emoji: '👶', title: 'Kids',     description: 'Emergency info for children',  route: '/setup/kids'     },
    { id: 'senior',   emoji: '👴', title: 'Senior',   description: 'Medical & contact details',    route: '/setup/senior'   },
    { id: 'pets',     emoji: '🐾', title: 'Pets',     description: 'Pet ID & owner info',          route: '/setup/pets'     },
    { id: 'business', emoji: '💼', title: 'Business', description: 'Card, links & company',        route: '/setup/business' },
    { id: 'vehicle',  emoji: '🚗', title: 'Vehicle',  description: 'Car info & owner contact',     route: '/setup/vehicle'  },
    { id: 'social',   emoji: '🌐', title: 'Social',   description: 'All your social links',        route: '/setup/social'   },
  ];

  constructor(private router: Router) {}

  select(card: CardType) {
    this.selectedCard = card.id;
  }

  continue() {
    const card = this.cards.find(c => c.id === this.selectedCard);
    if (card) this.router.navigate(['/register', card.id]);
  }
}