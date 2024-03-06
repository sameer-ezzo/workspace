import { EmailNotification, } from "../notification";
import { NotificationChannel } from "../notification-channel";

export type Mailer = NotificationChannel<EmailNotification>