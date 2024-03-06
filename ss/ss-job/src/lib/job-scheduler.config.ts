export const JOB_SCHEDULAR_CONFIG = "JOB_SCHEDULAR_CONFIG"
import Queue from 'bull'

export class JobSchedulerConfig {
    redis = "REDIS_DEFAULT" 
    settings?: Queue.AdvancedSettings
}
