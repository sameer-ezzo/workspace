import { ElementRef, EventEmitter, NgZone, TemplateRef } from '@angular/core';
import { PopoverPositionX, PopoverPositionY, PopoverTriggerEvent, PopoverScrollStrategy } from './popover-types';

export interface PopoverPanel {
    positionX: PopoverPositionX;
    positionY: PopoverPositionY;
    containerPositioning: boolean;
    overlapTrigger: boolean;
    triggerEvent: PopoverTriggerEvent;
    scrollStrategy: PopoverScrollStrategy;
    enterDelay: number;
    leaveDelay: number;
    targetOffsetX: number;
    targetOffsetY: number;
    arrowOffsetX: number;
    arrowWidth: number;
    arrowColor: string;
    closeOnClick: boolean;
    closeDisabled: boolean;
    setCurrentStyles: () => void;
    templateRef: TemplateRef<any>;
    close: EventEmitter<void>;
    zone: NgZone;
    setPositionClasses: (x: PopoverPositionX, y: PopoverPositionY) => void;
    _emitCloseEvent: () => void;
}

export interface PopoverConfig {
    positionX: PopoverPositionX;
    positionY: PopoverPositionY;
    overlapTrigger: boolean;
    triggerEvent: PopoverTriggerEvent;
    triggerDelay: number;
    targetOffsetX: number;
    targetOffsetY: number;
    arrowOffsetX: number;
    arrowWidth: number;
    arrowColor: string;
    closeOnClick: boolean;
}

export interface MdeTarget {
    _elementRef: ElementRef;
}
