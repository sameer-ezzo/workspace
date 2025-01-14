import {ComponentFixture, TestBed } from '@angular/core/testing';

import { HtmlEditorComponent } from './block-js-editor.component';

describe('InputComponent', () => {
  let component: HtmlEditorComponent;
  let fixture: ComponentFixture<HtmlEditorComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ HtmlEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HtmlEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
});
