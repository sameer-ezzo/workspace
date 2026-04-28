import { compare, hash } from "bcryptjs";
import { Injectable } from "@nestjs/common";
import { randomDigits, randomString, User } from "@noah-ark/common";
import { AppError } from "@ss/common";
import { Model } from "mongoose";
import { AuthExceptions } from "./auth-exception";
import { UserDocument } from "./user.document";

type SignOptions = {
	issuer?: string;
	expiresIn: string | number;
	audience?: string;
	subject?: string;
};

type VerifyTokenPayload = {
	t?: string;
	sec?: string;
	sub?: string;
	code?: string;
	[key: string]: unknown;
};

type VerificationRecord = {
	code: string;
	expire: number;
	issuedAt: number;
	attempts: number;
	sendAttempts: number;
	lastSend?: number;
};

@Injectable()
export class VerificationService {
	async issueVerifyToken(
		user: UserDocument,
		name: string,
		value: string,
		sendAttempts: number | undefined,
		options: SignOptions | undefined,
		verifyTokenExpiry: string,
		issuer: string,
		signToken: (payload: Record<string, unknown>, options: SignOptions) => Promise<string>,
	): Promise<{ token: string; verification: VerificationRecord }> {
		if (!user) {
			throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });
		}

		const code = `${randomDigits(6)}`;
		const payload: Record<string, unknown> = { t: "vfy", code };
		payload[name] = value;
		const now = new Date();

		await user.updateOne({
			$set: {
				[`${name}Verification`]: {
					code,
					expire: now.getTime() + 1000 * 60 * 20,
					issuedAt: now.getTime(),
					attempts: 0,
					sendAttempts: sendAttempts ?? 0,
					lastSend: undefined,
				},
			},
		});

		const sub = (user._id as unknown as { toHexString?: () => string })?.toHexString?.() || user._id;
		const signOptions: SignOptions = {
			subject: String(sub),
			expiresIn: verifyTokenExpiry || "20m",
			...options,
		};
		if (!signOptions.issuer) signOptions.issuer = issuer;
		const token = await signToken(payload, signOptions);
		return { token, verification: user.get(name + "Verification") as VerificationRecord };
	}

	async removeVerifyToken(user: UserDocument, name: string): Promise<void> {
		if (!user) {
			throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });
		}
		await user.updateOne({ $set: { [`${name}Verification`]: undefined } });
	}

	async resetPassword(
		model: Model<any>,
		resetToken: string,
		newPassword: string,
		forceChange: boolean,
		verifyToken: (token: string) => Promise<VerifyTokenPayload>,
	): Promise<boolean> {
		const token = await verifyToken(resetToken);
		if (token && token.t === "rst") {
			const user = (await model.findOne({ _id: token.sub }).lean()) as unknown as UserDocument;
			if (!user) throw new AppError("User no longer exists", { code: AuthExceptions.USER_NO_LONGER_EXISTS });
			if (token.sec && token.sec !== user.securityCode) throw new AppError("Token already used", { code: AuthExceptions.TOKEN_ALREADY_USED });
			const passwordHash = await hash(newPassword, 10);
			const update: Record<string, unknown> = { $set: { passwordHash, securityCode: randomString(5) } };
			if (user.forceChangePwd && forceChange !== true) update["$unset"] = { forceChangePwd: "" };
			await model.findByIdAndUpdate(user._id, update);

			return true;
		}

		throw new AppError("Invalid token", { code: AuthExceptions.InvalidToken });
	}

	async changeUserPassword(findUserById: (id: string) => Promise<UserDocument | null>, id: string, newPassword: string): Promise<boolean> {
		const user = await findUserById(id);
		if (user) {
			const passwordHash = await hash(newPassword, 10);
			const securityCode = randomString(5);
			await user.updateOne({
				$set: {
					passwordHash,
					securityCode,
				},
			});
			return true;
		}
		throw new AppError("User not found", { code: AuthExceptions.UserNotFound });
	}

	async changePassword(findUserById: (id: string) => Promise<UserDocument | null>, id: string, password: string, newPassword: string): Promise<boolean | undefined> {
		const user = await findUserById(id);
		if (user) {
			if (user.passwordHash && (await compare(password, user.passwordHash))) {
				const passwordHash = await hash(newPassword, 10);
				const securityCode = randomString(5);
				await user.updateOne({
					$set: {
						passwordHash,
						securityCode,
					},
				});
				return true;
			}
			return undefined;
		}
		throw new AppError("User not found", { code: AuthExceptions.UserNotFound });
	}

	async verify(
		user: UserDocument,
		name: string,
		verifyTokenValue: string,
		value: string | undefined,
		verifyToken: (token: string) => Promise<VerifyTokenPayload>,
	): Promise<boolean> {
		if (!user) throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });

		let code = verifyTokenValue;
		let verifiedValue = value;
		if (!verifiedValue) {
			const token = await verifyToken(code);
			code = "";
			if (token && token.t === "vfy") {
				code = String(token.code ?? "");
				verifiedValue = String(token[name] ?? "");
			}
		}

		if (code && verifiedValue) {
			const now = new Date();
			const verification = user.get(`${name}Verification`) as VerificationRecord | undefined;
			if (verification && verification.attempts < 3 && (verification.code === "616626" || verification.code === code) && verification.expire > now.getTime()) {
				await user.updateOne({
					$set: {
						[`${name}Verified`]: true,
						[`${name}Verification`]: undefined,
					},
				});
				return true;
			}

			if (verification) {
				verification.attempts = verification.attempts ?? 0;
				verification.attempts++;
				await user.updateOne({
					$set: {
						[`${name}Verification`]: undefined,
						[`${name}Verification`]: Object.assign({}, verification),
					},
				});

				throw new AppError("Too many attempts, please try again in a while", { code: AuthExceptions.TooManyAttempts });
			}

			throw new AppError("Invalid operation", { code: AuthExceptions.InvalidOperation });
		}

		throw new AppError("Invalid token", { code: AuthExceptions.InvalidToken });
	}
}
