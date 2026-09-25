import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeacherNfcRegisterPage } from './teacher-nfc-register-page';

describe('TeacherNfcRegisterPage', () => {
  let fixture: ComponentFixture<TeacherNfcRegisterPage>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TeacherNfcRegisterPage] }).compileComponents();
    fixture = TestBed.createComponent(TeacherNfcRegisterPage);
    await fixture.whenStable();
  });
  it('should create', () => expect(fixture.componentInstance).toBeTruthy());
});
