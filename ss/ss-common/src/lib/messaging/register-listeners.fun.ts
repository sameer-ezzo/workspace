import { NestExpressApplication } from "@nestjs/platform-express"
import { Broker } from "./broker.svr"
import { ServiceAnouncement } from "./model"


import { EndpointsInfo } from "./endpoints-info.fun"
import { appName } from "../bootstrap.fun"
import { logger } from "../logger"




export async function registerListeners(app: NestExpressApplication, redisOptions = {}) {

    if (EndpointsInfo.events.length || EndpointsInfo.commands.length) {
        // const store = new RedisStore("LISTENERS STORE",redisOptions);


        // await store.SET(`app:${appName}:events`, events.join(','))
        // await store.SET(`app:${appName}:commands`, commands.join(','))
        // await store.quit();

        // const broker = new RedisBroker(redisOptions)
        // await broker.PUBLISH('app.run', appName)
        // await broker.quit()

        try {
            const broker = await app.resolve(Broker)
            logger.info(`ANOUNCING LISTERNERS FOR ${appName}`)
            broker.emit<ServiceAnouncement>('service/announcement', {
                name: appName,
                events: EndpointsInfo.events.map(x => x.event),
                commands: EndpointsInfo.commands.map(x => x.command)
            })
        } catch (error) {
            logger.warn("Could not resolve Broker. Is CommonModule imported?")
        }


    }
}