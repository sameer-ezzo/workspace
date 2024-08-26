import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatInputComponent } from './input.component';

describe('InputComponent', () => {
  let component: MatInputComponent;
  let fixture: ComponentFixture<MatInputComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ MatInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
