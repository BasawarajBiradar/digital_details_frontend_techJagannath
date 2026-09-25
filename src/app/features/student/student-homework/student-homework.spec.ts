import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentHomework } from './student-homework';

describe('StudentHomework', () => {
  let fixture: ComponentFixture<StudentHomework>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StudentHomework] }).compileComponents();
    fixture = TestBed.createComponent(StudentHomework);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
