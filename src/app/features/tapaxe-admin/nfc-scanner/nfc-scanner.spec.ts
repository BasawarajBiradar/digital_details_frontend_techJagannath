import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NfcScanner } from './nfc-scanner';

describe('NfcScanner', () => {
  let component: NfcScanner;
  let fixture: ComponentFixture<NfcScanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NfcScanner],
    }).compileComponents();

    fixture = TestBed.createComponent(NfcScanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
