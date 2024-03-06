import { Controller, Inject } from "@nestjs/common"
import { EndPoint } from "@ss/common"
import { NotificationService } from "./notification.svr"
import { DataService } from "@ss/data"


@Controller('notification')
export class NotificationController {

    //TODO user settings



    constructor(public notification: NotificationService, @Inject("DB_NOTIFICATION") public data: DataService) {
        data.addModel('notification')
    }

    @EndPoint({ http: { path: "public-key" } })
    PublicKey() {
        return process.env.VAPID_PUBLIC_KEY
    }

}
