import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorTypeTableViewComponent } from './sensor-type-table-view.component';

describe('SensorTypeTableViewComponent', () => {
  let component: SensorTypeTableViewComponent;
  let fixture: ComponentFixture<SensorTypeTableViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SensorTypeTableViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SensorTypeTableViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
