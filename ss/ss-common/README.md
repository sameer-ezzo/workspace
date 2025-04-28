# @ss/common Module

This library provides a set of common utilities, configurations, and core services shared across NestJS applications within the workspace.

## Overview

`@ss/common` aims to centralize essential functionalities like application bootstrapping, messaging (inter-service communication), Redis integration, logging, and WebSocket handling. It offers a dynamic module (`CommonModule`) and a powerful `bootstrap` function to streamline application setup and ensure consistency.

## Features

-   **Application Bootstrapping**: Provides a `bootstrap` function (`bootstrap.fun.ts`) that handles:
    -   NestJS application creation (`NestExpressApplication`).
    -   Clustering for multi-core utilization.
    -   Standard middleware setup (JSON, URLencoded, text, static assets, CORS).
    -   WebSocket (Socket.IO) server integration with configurable adapters (default, Redis).
    -   Microservice connection management.
    -   Handlebars view engine setup.
    -   Global error handling and logging.
    -   Automatic ISO date string parsing in JSON.
    -   Pre-boot environment checks (e.g., UTC timezone).
-   **Dynamic Module (`CommonModule`)**: A global module providing shared services.
    -   Configurable Message Broker: Abstracts inter-service communication. Supports in-memory (`EventBusService`) by default or Redis (`ClientRedis`) based on configuration.
    -   Redis Client Management: Provides a `RedisClient` wrapper and automatically manages multiple named Redis connections defined via environment variables.
-   **Messaging Utilities**: Includes components like `Broker`, `EventBusService`, `BrokerController`, and functions for registering message listeners (`registerListeners`).
-   **WebSocket Utilities**: Includes a Redis adapter (`RedisIoAdapter`) for scalable WebSocket deployments.
-   **Shared Utilities**: Contains directories for general utils (`utils/`), HTTP models (`http.models.ts`), logging (`logger.ts`), etc.

## Key Components

-   `bootstrap(module, port, options?)`: The main function to start a NestJS application with common configurations.
-   `CommonModule`: The central dynamic, global NestJS module.
    -   `CommonModule.register(config?)`: Static method for configuring the module (e.g., selecting the message broker).
-   `Broker`, `EventBusService`, `BROKER_CLIENT`: Core components for the messaging system.
-   `RedisClient`: Wrapper for Redis interactions.
-   `parseRedisConfig`: Utility to read Redis connection details from environment variables.
-   `RedisIoAdapter`: Socket.IO adapter using Redis for pub/sub.
-   `AppOptions`: Interface defining configuration options for the `bootstrap` function.
-   `SSConfig`: Interface defining configuration options for the `CommonModule`.

## Dependencies

-   `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/platform-socket.io`, `@nestjs/microservices`
-   `express`, `socket.io`, `redis` (implicitly via RedisClient/Adapters)
-   `express-handlebars`
-   `@noah-ark/common`

## Configuration

Configuration happens through:

1.  **`bootstrap` function `options`**: Control clustering, WebSocket adapter, static assets, middleware, CORS, Handlebars, microservices.
2.  **`CommonModule.register(config)`**: Select the message broker implementation (`config.broker`: "bus" or `REDIS_MY_BROKER`).
3.  **Environment Variables**:
    -   `APP_NAME`: Sets the application name (used in logging).
    -   `REDIS_DEFAULT`, `REDIS_CACHE`, etc.: Define Redis connections in the format `host:port:db:password?`. `REDIS_DEFAULT` is used for the default `RedisClient` provider. Specific `REDIS_*` names can be used to configure the message broker or WebSocket adapter.

## Usage

**1. Bootstrap Application (e.g., in `main.ts`)**

```typescript
import { NestFactory } from '@nestjs/core'; // Standard NestFactory might still be needed for types or specific cases
import { AppModule } from './app/app.module';
import { bootstrap } from '@ss/common'; // Use the common bootstrap function

async function start() {
  await bootstrap(
    AppModule, // Your main application module
    3000, // Port number
    {
      applicationName: 'my-app',
      noOfClusters: process.env.NODE_ENV === 'production' ? 4 : 1, // Example: Use clustering in production
      socketAdapter: 'REDIS_PUBSUB', // Example: Use Redis for Socket.IO scaling
      // ... other AppOptions
    }
  );
}
start();
```

**2. Register CommonModule (e.g., in `app.module.ts`)**

```typescript
import { Module } from '@nestjs/common';
import { CommonModule } from '@ss/common';

@Module({
  imports: [
    CommonModule.register({
      // broker: 'REDIS_MESSAGES' // Optional: Use Redis for messaging
    }),
    // ... other application modules
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

**3. Inject Services**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { Broker, BROKER_CLIENT, RedisClient } from '@ss/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MyService {
  constructor(
    private readonly broker: Broker,
    @Inject(BROKER_CLIENT) private readonly brokerClient: ClientProxy | EventBusService, // Type depends on config
    private readonly redis: RedisClient, // Default Redis client
    @Inject('REDIS_CACHE') private readonly cacheRedis: RedisClient // Named Redis client
  ) {}

  async doSomething() {
    await this.broker.publish('some.event', { data: 'payload' });
    const value = await this.redis.get('my-key');
    await this.cacheRedis.set('cache-key', 'value', { EX: 3600 });
  }
}
```
