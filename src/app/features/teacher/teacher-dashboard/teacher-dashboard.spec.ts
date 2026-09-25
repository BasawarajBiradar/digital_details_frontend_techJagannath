import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeacherDashboard } from './teacher-dashboard';

describe('TeacherDashboard', () => {
  let fixture: ComponentFixture<TeacherDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TeacherDashboard] }).compileComponents();
    fixture = TestBed.createComponent(TeacherDashboard);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
