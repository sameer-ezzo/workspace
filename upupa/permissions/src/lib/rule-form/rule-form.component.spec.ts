import {ComponentFixture, TestBed } from '@angular/core/testing';
import {RuleFormComponent} from './rule-form.component.ts'

describe('RuleFormComponent', () => {
  let component: RuleFormComponent;
  let fixture: ComponentFixture<RuleFormComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ RuleFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
