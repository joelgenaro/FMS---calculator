import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptimizationContainerComponent } from './optimization-container.component';

describe('OptimizationComponent', () => {
  let component: OptimizationContainerComponent;
  let fixture: ComponentFixture<OptimizationContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptimizationContainerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptimizationContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
