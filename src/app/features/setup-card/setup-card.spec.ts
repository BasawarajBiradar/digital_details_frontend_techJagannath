import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupCard } from './setup-card';

describe('SetupCard', () => {
  let component: SetupCard;
  let fixture: ComponentFixture<SetupCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupCard],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
