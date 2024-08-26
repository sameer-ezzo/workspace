import {ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchComponent } from './switch.component';

describe('InputComponent', () => {
  let component: SwitchComponent;
  let fixture: ComponentFixture<SwitchComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ SwitchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
