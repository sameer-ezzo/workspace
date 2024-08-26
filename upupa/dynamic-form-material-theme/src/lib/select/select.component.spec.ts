import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSelectComponent } from './select.component';


describe('SelectComponent', () => {
  let component: MatSelectComponent;
  let fixture: ComponentFixture<MatSelectComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ MatSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
