import { HttpException } from "@nestjs/common";
import { UsersController } from "./users.controller";

describe("UsersController auth compatibility", () => {
    const createController = (authOverrides: Record<string, unknown> = {}): UsersController =>
        new UsersController(
            {
                options: {
                    useCookies: {
                        enabled: true,
                        cookieName: "auth",
                        options: { path: "/" },
                    },
                },
                signOut: jest.fn().mockResolvedValue(undefined),
                ...authOverrides,
            } as never,
            {} as never,
            {} as never,
            {} as never,
            { emit: jest.fn() } as never,
        );

    it("uses access_token when provided", () => {
        const controller = createController();
        const token = (controller as never as { getSocialToken: (req: unknown) => string }).getSocialToken({ access_token: "abc", token: "fallback" });

        expect(token).toBe("abc");
    });

    it("falls back to token when access_token is missing", () => {
        const controller = createController();
        const token = (controller as never as { getSocialToken: (req: unknown) => string }).getSocialToken({ token: "legacy" });

        expect(token).toBe("legacy");
    });

    it("throws BAD_REQUEST when provider token is missing", () => {
        const controller = createController();
        const fn = () => (controller as never as { getSocialToken: (req: unknown) => string }).getSocialToken({});

        expect(fn).toThrow(HttpException);
    });

    it("maps canonical facebook route to handler", async () => {
        const controller = createController();
        const req = { token: "x" };
        const response = { access_token: "a", refresh_token: "b" };
        const handler = jest.spyOn(controller as never as { handleFacebookClientExternalAuth: (r: unknown) => Promise<unknown> }, "handleFacebookClientExternalAuth");
        handler.mockResolvedValue(response);

        await expect(controller.facebookClientExternalAuth(req as never)).resolves.toEqual(response);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(req);
    });

    it("validates refresh grant requires refresh_token", () => {
        const controller = createController();
        const fn = () =>
            (controller as never as { validateSigninRequest: (payload: unknown) => void }).validateSigninRequest({ grant_type: "refresh" });

        expect(fn).toThrow(HttpException);
    });

    it("invalidates user sessions on signout and clears auth cookie", async () => {
        const signOut = jest.fn().mockResolvedValue(undefined);
        const controller = createController({ signOut });
        const res = {
            send: jest.fn(),
            clearCookie: jest.fn(),
        };

        await controller.signOut(res as never, { principle: { sub: "user-1" } } as never);

        expect(signOut).toHaveBeenCalledWith({ _id: "user-1" });
        expect(res.clearCookie).toHaveBeenCalledWith("auth", { path: "/" });
        expect(res.send).toHaveBeenCalledWith({ success: true, message: "Logout successful" });
    });

    it("rejects signout when principal is missing", async () => {
        const controller = createController();
        const res = {
            send: jest.fn(),
            clearCookie: jest.fn(),
        };

        await expect(controller.signOut(res as never, { principle: undefined } as never)).rejects.toBeInstanceOf(HttpException);
    });

    it("rejects verification send for unsupported target names", async () => {
        const controller = createController();

        await expect(
            controller.sendVerification(
                {
                    payload: {
                        name: "username",
                        value: "test@example.com",
                    },
                    principle: undefined,
                } as never,
            ),
        ).rejects.toBeInstanceOf(HttpException);
    });

    it("rejects verification request with unsupported verify type", async () => {
        const user = { disabled: false };
        const controller = createController({
            findUserByEmail: jest.fn().mockResolvedValue(user),
        });

        await expect(
            controller.verify(
                {
                    payload: {
                        name: "email",
                        value: "test@example.com",
                        token: "123456",
                        type: "otp",
                    },
                    principle: undefined,
                } as never,
            ),
        ).rejects.toBeInstanceOf(HttpException);
    });

    it("blocks verification send after max send attempts", async () => {
        const verification = {
            attempts: 0,
            sendAttempts: 5,
            issuedAt: Date.now(),
            lastSend: Date.now() - 61_000,
            code: "123456",
            expire: Date.now() + 100_000,
        };
        const user = {
            _id: "user-1",
            disabled: false,
            get: jest.fn().mockReturnValue(verification),
            set: jest.fn(),
            save: jest.fn(),
        };
        const issueVerifyToken = jest.fn();
        const controller = createController({
            findUserByEmail: jest.fn().mockResolvedValue(user),
            issueVerifyToken,
        });

        await expect(
            controller.sendVerification(
                {
                    payload: {
                        name: "email",
                        value: "test@example.com",
                    },
                    principle: undefined,
                } as never,
            ),
        ).rejects.toBeInstanceOf(HttpException);

        expect(issueVerifyToken).not.toHaveBeenCalled();
    });
});
