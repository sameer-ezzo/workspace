import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormViewModelComponent } from './form-view-model.component';

describe('FormViewModelComponent', () => {
  let component: FormViewModelComponent;
  let fixture: ComponentFixture<FormViewModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormViewModelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormViewModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
