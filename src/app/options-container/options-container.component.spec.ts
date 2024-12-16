import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionsContainerComponent } from './options-container.component';

describe('OptionsContainerComponent', () => {
  let component: OptionsContainerComponent;
  let fixture: ComponentFixture<OptionsContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptionsContainerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptionsContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
