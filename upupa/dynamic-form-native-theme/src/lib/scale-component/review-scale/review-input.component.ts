import { Component, Input, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SliderComponent } from '../slider/slider.component';


function dir(el: any): 'rtl' | 'ltr' {
	if (window.getComputedStyle) return <any>window.getComputedStyle(el, null).getPropertyValue('direction'); // all browsers
	else return el.currentStyle.direction; // IE5-8
}

const off = 999999999;

@Component({
	selector: 'form-review-input-field',
	templateUrl: './review-input.component.html',
	styleUrls: ['./review-input.component.css'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => ReviewScaleComponent),
			multi: true,
		},
		{ provide: NG_VALIDATORS, useExisting: forwardRef(() => ReviewScaleComponent), multi: true }
	]
})
export class ReviewScaleComponent extends SliderComponent {

	@Input() image : string;

	_offset = off;
	_valueOffset = 600;//todo: Ramy's constant

	_move(event: Event, target: any, eventArgs: { clientX: number }) {
		event.stopPropagation();
		const _dir = dir(target);
		const rect = target.getClientRects()[0];
		const percentage = this._normalizePercentage((eventArgs.clientX - rect.x) / rect.width, _dir);

		this._offset = this._normalizeOffset(rect.width,percentage, _dir);
	}

	_end(event: Event, target?: any, eventArgs?: { clientX: number }) {
		event.stopPropagation();

		if (target) {
			const _dir = dir(target);
			const rect = target.getClientRects()[0];
			this.percentage = this._normalizePercentage((eventArgs.clientX - rect.x) / rect.width, _dir);
			this._valueOffset = this._normalizeOffset(rect.width, this.percentage, _dir);
			this.propagateChange();
		}

		this._offset = off;
	}


	_normalizePercentage(percentage: number, _dir: 'rtl' | 'ltr') {
		if (this.step > 0) {
			const interval = this.ceil - this.floor;
			const stepPercentage = this.step / interval;
			const x = percentage / stepPercentage;
			const y = _dir === 'rtl' ? Math.floor(x) : Math.ceil(x);
			return stepPercentage * y;
		}
		return percentage;
	}

	_normalizeOffset(width: number, percentage: number, _dir: 'rtl' | 'ltr'): number {
		let offset = 0;
		if (_dir === 'rtl') offset = percentage * width;
		else offset = (percentage - 1) * width;

		return Math.round(offset);
	}


}


