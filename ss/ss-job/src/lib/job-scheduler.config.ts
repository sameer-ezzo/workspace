export const JOB_SCHEDULAR_CONFIG = "JOB_SCHEDULAR_CONFIG";
import Queue from "bull";

export class JobSchedulerConfig {
    constructor(
        public redis = "REDIS_DEFAULT",
        public settings?: Queue.AdvancedSettings,
    ) {}
}
