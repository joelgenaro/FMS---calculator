import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForcesContainerComponent } from './forces-container.component';

describe('ForcesContainerComponent', () => {
  let component: ForcesContainerComponent;
  let fixture: ComponentFixture<ForcesContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForcesContainerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForcesContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
