import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrModel } from './qr-model';

describe('QrModel', () => {
  let component: QrModel;
  let fixture: ComponentFixture<QrModel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrModel],
    }).compileComponents();

    fixture = TestBed.createComponent(QrModel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
