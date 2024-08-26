import {ComponentFixture, TestBed } from '@angular/core/testing';

import { ThumbsGridComponent } from './thumbs-grid.component';

describe('ThumbsGridComponent', () => {
  let component: ThumbsGridComponent;
  let fixture: ComponentFixture<ThumbsGridComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ ThumbsGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThumbsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
