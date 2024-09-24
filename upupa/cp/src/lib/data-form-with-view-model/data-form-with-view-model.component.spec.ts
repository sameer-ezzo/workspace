import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataFormComponent } from './data-form-with-view-model.component';

describe('DataFormComponent', () => {
  let component: DataFormComponent;
  let fixture: ComponentFixture<DataFormComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ DataFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
