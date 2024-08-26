import {ComponentFixture, TestBed } from '@angular/core/testing';

import { RulesListComponent } from './permissions-side-bar.component';

describe('PermissionsComponent', () => {
  let component: RulesListComponent;
  let fixture: ComponentFixture<RulesListComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ RulesListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RulesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
