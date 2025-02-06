import {  ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDateInputComponent } from './calendar-input.component';

describe('InputComponent', () => {
  let component: MatDateInputComponent;
  let fixture: ComponentFixture<MatDateInputComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ MatDateInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatDateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
