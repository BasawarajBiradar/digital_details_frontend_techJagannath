import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeacherNfcLandingPage } from './teacher-nfc-landingpage';

describe('TeacherNfcLandingPage', () => {
  let fixture: ComponentFixture<TeacherNfcLandingPage>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TeacherNfcLandingPage] }).compileComponents();
    fixture = TestBed.createComponent(TeacherNfcLandingPage);
    await fixture.whenStable();
  });
  it('should create', () => expect(fixture.componentInstance).toBeTruthy());
});
