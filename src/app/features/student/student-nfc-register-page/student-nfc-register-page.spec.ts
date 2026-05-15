import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentNfcRegisterPage } from './student-nfc-register-page';

describe('StudentNfcRegisterPage', () => {
  let component: StudentNfcRegisterPage;
  let fixture: ComponentFixture<StudentNfcRegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentNfcRegisterPage],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentNfcRegisterPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
