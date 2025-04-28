# @ss/notifications Module

This library provides a flexible system for sending notifications across various channels (e.g., email, push, SMS) within NestJS applications.

## Overview

`@ss/notifications` allows defining different notification types (topics) and associating them with specific delivery channels. It handles recipient data fetching, preference checking (unsubscribes), delivery orchestration across configured channels, and optional logging of sent notifications.

## Features

-   **Multi-Channel Support**: Define and register different notification channel implementations (e.g., EmailChannel, PushChannel).
-   **Topic-Based Routing**: Configure topics (e.g., `verify-email`, `new-message`) and map them to one or more channels.
-   **Dynamic Configuration**: Uses a dynamic module (`NotificationsModule`) registered via `NotificationsModule.register()`.
-   **Recipient Handling**:
    -   Automatically fetches required recipient data (e.g., email, push token) using `@ss/data` based on channel needs (`inflateRecipients`).
    -   Filters recipients based on user preferences (`notificationSettings` field on the user object) and notification tags.
    -   Prevents duplicate sends for notifications with the same reference ID (`ref`) if storage is enabled.
-   **Delivery Orchestration**: Sends notifications sequentially through the configured channels for a topic, allowing fallbacks if a channel fails for some recipients.
-   **Delivery Reporting**: Tracks sent, not sent (with reasons like `deflated`, `unsubscribed`, `already-sent`), and optionally received statuses per recipient.
-   **Optional Storage**: Can store records of sent notifications in a MongoDB collection (`notification`) if configured.

## Key Components

-   `NotificationsModule`: The main dynamic, global NestJS module.
    -   `NotificationsModule.register(channels, topics?, config?)`: Static method for configuration.
-   `NotificationService`: The core service orchestrating the notification sending process.
    -   `send(notification, channelsOptions?, notificationOptions?)`: Method to initiate sending a notification.
-   `NotificationChannel`: Interface/base class for channel implementations (e.g., `EmailChannel`, `PushChannel`). Channels implement the `send` method and define required/optional recipient fields.
-   `Notification`: Interface defining the notification payload (topic, recipients, body, payload, tags, etc.).
-   `Recipient`: Interface defining the basic recipient structure (at least `_id`).
-   `Topics`: Type defining the mapping between topic names and their associated channels/options.
-   `ChannelsOptions`, `ChannelOptions`: Types for passing channel-specific configuration during sending.
-   `NotificationOptions`: Type for passing topic-specific options (e.g., `store: true`).

## Dependencies

-   `@nestjs/common`, `@nestjs/core`
-   `@ss/data` (required for recipient inflation and optional storage)
-   `@ss/common` (provides `logger`)
-   `@nestjs/mongoose` (if notification storage is used)
-   `@noah-ark/common`

## Configuration

Configuration is done via `NotificationsModule.register(channels, topics, config)`:

```typescript
// Example Channel Implementations (must implement NotificationChannel)
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';

// Example Topic Configuration
const notificationTopics: Topics = {
  'user-welcome': {
    channels: [EmailChannel.name], // Reference channels by their provider name/token
    options: { store: true } // Store records for welcome emails
  },
  'order-update': {
    channels: [PushChannel.name, EmailChannel.name] // Try Push first, then Email
  }
};

// Example Module Registration (in app.module.ts)
import { Module } from '@nestjs/common';
import { NotificationsModule, Topics } from '@ss/notifications';
import { DataModule } from '@ss/data'; // Needed for DataService
import { CommonModule } from '@ss/common';
import { EmailChannel } from './channels/email.channel'; // Your channel implementations
import { PushChannel } from './channels/push.channel';
import { notificationSchema } from './schemas/notification.schema'; // Your notification schema

@Module({
  imports: [
    CommonModule.register(),
    DataModule.register({ /* ... dbOptions ... */ }), // Ensure DataService is available
    NotificationsModule.register(
      // Provide channel implementations
      [EmailChannel, PushChannel],
      notificationTopics,
      {
        dbName: 'DB_DEFAULT', // Database for storing notifications & fetching users
        notificationSchema: notificationSchema, // Schema for the 'notification' collection
        readNotificationSettings: true // Fetch user notification settings
      }
    ),
    // ... other modules
  ],
  // Provide channels if they are injectable services
  providers: [EmailChannel, PushChannel]
})
export class AppModule {}
```

-   `channels`: An array of channel *providers* or *instances*. If channels are injectable services, provide the class names and ensure they are also listed in the `providers` array of the importing module.
-   `topics`: Defines which channels handle which topic.
-   `config`: Specifies the database connection (`dbName`), the schema for the `notification` collection, and whether to read user settings.

## Usage

**1. Inject NotificationService**

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService } from '@ss/notifications';
import { Notification, Recipient } from '@ss/notifications';

@Injectable()
export class OrderService {
  constructor(private readonly notificationService: NotificationService) {}

  async confirmOrder(order: any, user: Recipient) {
    const notification: Notification = {
      topic: 'order-update', // Matches a configured topic
      recipients: [user], // Array of recipients (at least { _id: string })
      body: `Your order #${order.id} has been confirmed.`,
      payload: { orderId: order.id, status: 'confirmed' }, // Optional data for channels
      tags: ['orders', 'shipping'], // Optional tags for filtering/preferences
      ref: `order_${order.id}` // Optional reference to prevent duplicates
    };

    try {
      const report = await this.notificationService.send(notification);
      console.log('Notification Report:', report.summary);
      if (report.delivery.notSent.length > 0) {
        console.warn('Some notifications were not sent:', report.delivery.notSent);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
}
```

**2. Implement NotificationChannel**

Channels must implement the `NotificationChannel` interface:

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationChannel, Notification, ChannelOptions, DeliveryReport, Recipient } from '@ss/notifications';

@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly name = 'EmailChannel'; // Unique name used in topic config
  readonly type = 'email'; // General type used for settings lookup
  readonly requiredFields: (keyof Recipient)[] = ['email']; // Fields needed from recipient object
  readonly optionalFields: (keyof Recipient)[] = ['name'];

  async send(notification: Notification, options: ChannelOptions, notificationOptions: NotificationOptions): Promise<DeliveryReport> {
    const report: DeliveryReport = { sent: [], notSent: [] };

    for (const recipient of notification.recipients) {
      if (!recipient.email) {
        report.notSent.push({ recipient, date: new Date(), error: 'Missing email' });
        continue;
      }

      try {
        // Actual email sending logic using recipient.email, notification.body, etc.
        // Use options if needed (e.g., options.apiKey)
        console.log(`Simulating sending email to ${recipient.email} for topic ${notification.topic}`);
        report.sent.push({ recipient, date: new Date() });
      } catch (error) {
        report.notSent.push({ recipient, date: new Date(), error: error.message });
      }
    }
    return report;
  }
}
```
