import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatTextAreaComponent } from './text-area.component';

describe('InputComponent', () => {
  let component: MatTextAreaComponent;
  let fixture: ComponentFixture<MatTextAreaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MatTextAreaComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTextAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
