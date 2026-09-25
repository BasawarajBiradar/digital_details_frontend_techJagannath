import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentTapPhotos } from './student-tap-photos';

describe('StudentTapPhotos', () => {
  let component: StudentTapPhotos;
  let fixture: ComponentFixture<StudentTapPhotos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentTapPhotos],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentTapPhotos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
