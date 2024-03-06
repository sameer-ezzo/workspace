import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatPhoneInputComponent } from './phone.component';

describe('InputComponent', () => {
  let component: MatPhoneInputComponent;
  let fixture: ComponentFixture<MatPhoneInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MatPhoneInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatPhoneInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
