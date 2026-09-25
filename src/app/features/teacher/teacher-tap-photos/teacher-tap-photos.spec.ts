import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeacherTapPhotos } from './teacher-tap-photos';

describe('TeacherTapPhotos', () => {
  let fixture: ComponentFixture<TeacherTapPhotos>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TeacherTapPhotos] }).compileComponents();
    fixture = TestBed.createComponent(TeacherTapPhotos);
    await fixture.whenStable();
  });
  it('should create', () => expect(fixture.componentInstance).toBeTruthy());
});
