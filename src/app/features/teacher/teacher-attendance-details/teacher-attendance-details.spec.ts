import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeacherAttendanceDetails } from './teacher-attendance-details';

describe('TeacherAttendanceDetails', () => {
  let fixture: ComponentFixture<TeacherAttendanceDetails>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TeacherAttendanceDetails] }).compileComponents();
    fixture = TestBed.createComponent(TeacherAttendanceDetails);
    await fixture.whenStable();
  });
  it('should create', () => expect(fixture.componentInstance).toBeTruthy());
});
