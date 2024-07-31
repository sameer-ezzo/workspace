import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatBtnComponent } from './mat-btn.component';

describe('MatBtnComponent', () => {
    let component: MatBtnComponent;
    let fixture: ComponentFixture<MatBtnComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MatBtnComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MatBtnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
