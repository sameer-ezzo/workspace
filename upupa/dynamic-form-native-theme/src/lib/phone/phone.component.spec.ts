import {ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneInputComponent } from './phone.component';

describe('InputComponent', () => {
  let component: PhoneInputComponent;
  let fixture: ComponentFixture<PhoneInputComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ PhoneInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoneInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
