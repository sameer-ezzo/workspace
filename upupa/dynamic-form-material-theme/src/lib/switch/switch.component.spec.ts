import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatSwitchComponent } from './switch.component';

describe('InputComponent', () => {
  let component: MatSwitchComponent;
  let fixture: ComponentFixture<MatSwitchComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ MatSwitchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
