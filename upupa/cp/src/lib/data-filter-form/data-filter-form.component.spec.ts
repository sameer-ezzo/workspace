import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataFilterFormComponent } from './data-filter-form.component';

describe('DataFilterFormComponent', () => {
    let component: DataFilterFormComponent;
    let fixture: ComponentFixture<DataFilterFormComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DataFilterFormComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataFilterFormComponent);
        component = fixture.componentInstance;
        component.fields = {}
        component.filterDescriptor = {}

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
