import { DynamicModule, Inject, Module, OnModuleInit, Provider } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { CommonModule, logger } from "@ss/common";
import { DataService } from "@ss/data";
import { RulesModule } from "@ss/rules";
import { AuthModule, AuthService } from "@ss/auth";
import { UsersOptions } from "./types";
import { User } from "@noah-ark/common";
import { EventEmitterModule } from "@nestjs/event-emitter";

const defaultOptions = new UsersOptions();

const providers: Provider[] = [];

export class UsersModule implements OnModuleInit {
    constructor(
        @Inject("DB_AUTH") public readonly data: DataService,
        private auth: AuthService,
        @Inject("USERS_OPTIONS") private readonly options: UsersOptions,
    ) {}

    async onModuleInit() {
        if (this.options.superAdmin.password) {
            const { password, email, username, name } = this.options.superAdmin;
            logger.info(`Setting super admin user to ${name ?? username}:${email}`);
            await this.installSuperAdmin({ email, username: username ?? email, name }, password, "super-admin");
        }
    }
    static register(userOptions: Partial<UsersOptions> = {}): DynamicModule {
        const options = {
            ...defaultOptions,
            ...userOptions,
        } as UsersOptions;

        const superAdminErrors = this.validateSuperAdmin(options.superAdmin);
        if (superAdminErrors) {
            logger.error(`Invalid super admin options: ${JSON.stringify(superAdminErrors)}`);
        }

        return {
            global: true,
            module: UsersModule,
            imports: [EventEmitterModule.forRoot({ wildcard: true })],
            providers: [...providers, { provide: "USERS_OPTIONS", useValue: options }],
            controllers: [UsersController],
        };
    }

    static validateSuperAdmin(superAdmin: UsersOptions["superAdmin"]): Record<string, string> | undefined {
        const errors: Record<string, string> = {};
        const email = superAdmin.email?.trim();
        if (!email) errors.email = "Super admin email is required";
        //make sure email is lowercase and does not contain invalid chars
        if (/[^a-zA-Z0-9@._-]/.test(email)) errors.email = "Super admin email contains invalid characters";

        const password = superAdmin.password?.trim();
        if (!password) errors.password = "Super admin password is required";

        return Object.keys(errors).length ? errors : undefined;
    }

    private async installSuperAdmin(user: Partial<User>, password: string, role = "super-admin") {
        const usersModel = await this.data.getModel("user");
        if (!usersModel) throw new Error("MISSING_USER_MODEL");
        try {
            const dbUser = await usersModel.findOne({ email: user.email });
            let u = dbUser;
            if (!u) {
                logger.info(`Creating super admin user.`);
                const payload = { ...user } as Partial<User>;
                u = await this.auth.signUp(payload as Partial<User>, password);
            } else {
                logger.info(`Super admin user already exists, Setting password.`);
            }
            await this.auth.addUserToRoles(u._id, [role]);
            logger.info(`Super admin user set to ${user.email}`);
            return { ...u, roles: [...(u.roles ?? []), role] };
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }
}
