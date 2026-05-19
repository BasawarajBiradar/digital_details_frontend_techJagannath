import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCropModal } from './image-crop-modal';

describe('ImageCropModal', () => {
  let component: ImageCropModal;
  let fixture: ComponentFixture<ImageCropModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCropModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageCropModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
