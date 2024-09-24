import {  ComponentFixture, TestBed } from '@angular/core/testing';

import { DataListComponent } from './data-list-with-inputs.component';

describe('DataListComponent', () => {
  let component: DataListComponent;
  let fixture: ComponentFixture<DataListComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ DataListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
