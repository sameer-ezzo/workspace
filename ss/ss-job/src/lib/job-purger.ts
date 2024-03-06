import { Queue } from "bull"
import { logger } from "./logger"

export async function purgeQueue(queue: Queue) {

    const days = 7;
    const grace = 1000 * 60 * 60 * 60 * 24 * days; //7 days
    logger.log(`Purging queue ${queue.name} : COMPLETED JOBS older than ${days} days`);
    await queue.clean(grace)
    logger.log(`Purging queue ${queue.name} : FAILED JOBS older than ${days} days`);
    await queue.clean(grace, 'failed')
    logger.log(`Purging queue ${queue.name} : DONE`)
}