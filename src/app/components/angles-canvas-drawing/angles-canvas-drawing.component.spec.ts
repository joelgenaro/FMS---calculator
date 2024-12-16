import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnglesCanvasDrawingComponent } from './angles-canvas-drawing.component';

describe('AnglesCanvasDrawingComponent', () => {
  let component: AnglesCanvasDrawingComponent;
  let fixture: ComponentFixture<AnglesCanvasDrawingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnglesCanvasDrawingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnglesCanvasDrawingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
