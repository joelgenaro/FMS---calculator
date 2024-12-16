import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorTypeContainerComponent } from './sensor-type-container.component';

describe('SensorTypeContainerComponent', () => {
  let component: SensorTypeContainerComponent;
  let fixture: ComponentFixture<SensorTypeContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SensorTypeContainerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SensorTypeContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
