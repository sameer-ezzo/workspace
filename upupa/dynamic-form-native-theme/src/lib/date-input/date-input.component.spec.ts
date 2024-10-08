import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateInputComponent } from './date-input.component';

describe('InputComponent', () => {
  let component: DateInputComponent;
  let fixture: ComponentFixture<DateInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DateInputComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
