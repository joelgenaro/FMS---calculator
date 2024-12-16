import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentItemComponent } from './current-item.component';

describe('CurrentItemComponent', () => {
  let component: CurrentItemComponent;
  let fixture: ComponentFixture<CurrentItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrentItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrentItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
