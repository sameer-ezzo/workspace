import { User } from "@noah-ark/common"
import { ChannelType, NotificationTag } from "./notification"

type RecipientBase = Partial<User> & Pick<User, '_id'>
export type Recipient = RecipientBase & {
    notificationSettings?: {
        [channelType: ChannelType]: {
            filterOut: NotificationTag[]
        }
    }
}
