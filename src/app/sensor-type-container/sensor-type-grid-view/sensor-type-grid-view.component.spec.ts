import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorTypeGridViewComponent } from './sensor-type-grid-view.component';

describe('SensorTypeGridViewComponent', () => {
  let component: SensorTypeGridViewComponent;
  let fixture: ComponentFixture<SensorTypeGridViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SensorTypeGridViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SensorTypeGridViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
