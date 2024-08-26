import {ComponentFixture, TestBed } from '@angular/core/testing';


describe('PermissionFormComponent', () => {
  let component: PermissionFormComponent;
  let fixture: ComponentFixture<PermissionFormComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ PermissionFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PermissionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
