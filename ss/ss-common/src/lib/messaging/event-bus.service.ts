import { Injectable } from "@nestjs/common";
import { EventBusBase } from "@noah-ark/event-bus";

@Injectable()
export class EventBusService extends EventBusBase {

}