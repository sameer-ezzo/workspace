import { Injectable } from "@angular/core";
import { ConditionalLogicServiceBase } from "@noah-ark/expression-engine";
import { EventBus } from '@upupa/common';


@Injectable({ providedIn: 'root' })
export class ConditionalLogicService extends ConditionalLogicServiceBase {
    constructor(bus: EventBus) { super(bus); }
}
