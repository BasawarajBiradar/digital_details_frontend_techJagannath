import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentNfcLandingpage } from './student-nfc-landingpage';

describe('StudentNfcLandingpage', () => {
  let component: StudentNfcLandingpage;
  let fixture: ComponentFixture<StudentNfcLandingpage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentNfcLandingpage],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentNfcLandingpage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
