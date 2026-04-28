import { Injectable } from "@nestjs/common";
import { compare } from "bcryptjs";
import { AppError } from "@ss/common";
import { AuthExceptions } from "./auth-exception";
import { Principle, User, UserDevice } from "@noah-ark/common";
import { UserDocument } from "./user.document";

@Injectable()
export class SessionService {
	async signInUserByIdentifier(
		findUser: () => Promise<UserDocument | null>,
		password: string,
		device: UserDevice,
		signInUser: (user: UserDocument, password?: string | null, registerAttempt?: boolean, device?: UserDevice | null) => Promise<UserDocument | undefined>,
	): Promise<UserDocument> {
		const user = await findUser();
		return this.requireSignedInUser(await signInUser(user, password, true, device));
	}

	async signInUserByIdAndPassword(
		findUserById: (id: string) => Promise<UserDocument | null>,
		registerFailedAttempt: (user: UserDocument) => Promise<unknown>,
		signInUser: (user: UserDocument, password?: string | null, registerAttempt?: boolean, device?: UserDevice | null) => Promise<UserDocument | undefined>,
		id: string,
		password: string | undefined,
		device: UserDevice,
	): Promise<UserDocument> {
		const user = await findUserById(id);
		if (!user) throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });

		if (!password && (user.passwordHash || user.email || user.phone)) {
			await registerFailedAttempt(user);
			throw new AppError("Invalid passwordless signin request", { code: AuthExceptions.INVALID_PASSWORDLESS_SIGNIN_REQUEST });
		}

		return this.requireSignedInUser(await signInUser(user, password, true, device));
	}

	async signInUserByRefreshToken(
		verifyToken: (refreshToken: string) => Promise<any>,
		findUserById: (id: string) => Promise<UserDocument | null>,
		signInUser: (user: UserDocument, password?: string | null, registerAttempt?: boolean, device?: UserDevice | null) => Promise<UserDocument | undefined>,
		refreshToken: string,
	): Promise<UserDocument> {
		const token = await verifyToken(refreshToken);
		if (token && token.t === "rfs") {
			const user = await findUserById(token.sub);
			if (!user) throw new AppError("User not found", { code: AuthExceptions.UserNotFound });
			if (user.securityCode !== token.sec) throw new AppError("Invalid security code", { code: AuthExceptions.InvalidSecurityCode });

			await signInUser(user, null, true, token.d ? token.d : null);
			const additionalClaims = token.claims ?? {};
			user.claims ??= {};
			user.claims = { ...user.claims, ...additionalClaims };
			return user;
		}

		throw new AppError("Invalid token", { code: AuthExceptions.InvalidToken });
	}

	async signInUserByPrinciple(
		findUserByKey: (key: keyof User, value: User[keyof User]) => Promise<UserDocument | null>,
		signInUser: (user: UserDocument, password?: string | null, registerAttempt?: boolean, device?: UserDevice | null) => Promise<UserDocument | undefined>,
		principle: Principle,
		key: keyof User = "email",
	): Promise<UserDocument> {
		if (!principle) throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });
		const user = await findUserByKey(key, principle[key]);
		if (!user) throw new AppError("User not found", { code: AuthExceptions.UserNotFound });
		if (user.securityCode !== principle.sec) throw new AppError("Invalid security code", { code: AuthExceptions.InvalidSecurityCode });

		await signInUser(user, null, true, null);
		user.claims ??= {};
		return user;
	}

	async signInUser(
		user: UserDocument,
		password: string | null | undefined,
		registerAttempt: boolean,
		device: UserDevice | null | undefined,
		registerSuccessLoginAttempt: (user: UserDocument, device?: unknown) => Promise<unknown>,
		registerFailedAttempt: (user: UserDocument) => Promise<unknown>,
		logError: (message: string, error: unknown) => void,
	): Promise<UserDocument | undefined> {
		if (!user) throw new AppError("Invalid attempt", { code: AuthExceptions.INVALID_ATTEMPT });
		if (user.disabled) throw new AppError("User disabled", { code: AuthExceptions.UserDisabled });

		const userDoc = user._doc as User;
		const isPasswordCorrect = password ? await compare(password, userDoc.passwordHash) : true;
		if (isPasswordCorrect) {
			try {
				if (registerAttempt) await registerSuccessLoginAttempt(user, device);
			} catch (err) {
				logError("signInUser could not register success login attempt", err);
			}
			return user;
		}

		try {
			if (registerAttempt) await registerFailedAttempt(user);
		} catch (err) {
			logError("signInUser could not register failed login attempt", err);
		}

		return undefined;
	}

	private requireSignedInUser(user: UserDocument | undefined): UserDocument {
		if (!user) throw new AppError("Invalid attempt", { code: AuthExceptions.INVALID_ATTEMPT });
		return user;
	}

	async signOut(
		model: { findOne(filter: { _id: unknown }): Promise<UserDocument | null> },
		user: User | Pick<User, "_id">,
		nextSecurityCode: string,
	): Promise<void> {
		const currentUser = await model.findOne({ _id: user._id });
		if (!currentUser) throw new AppError("User no longer exists", { code: AuthExceptions.USER_NO_LONGER_EXISTS });
		await currentUser.updateOne({ $set: { securityCode: nextSecurityCode } });
	}
}
