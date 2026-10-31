import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CookieOptions, Response } from "express";
import { EnvConfig } from "src/modules/global/config/environment.config";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Session design
 * - access token: valid for 1 day, stored in the `access_token` cookie
 * - refresh token: always issued, valid for 7 days (30 days with "remember me"),
 *   stored in the `refresh_token` cookie
 * When the access token is missing/expired but the refresh token is still valid,
 * the AuthGuard silently issues a new access token, so the user stays logged in.
 * The cookie lifetime always matches the lifetime of the token it contains.
 */
@Injectable()
export class AuthHelper {
    private readonly envConfig: EnvConfig;

    public readonly ACCESS_COOKIE_NAME = "access_token";
    public readonly ACCESS_COOKIE_MAX_AGE = DAY;
    public readonly ACCESS_JWT_EXPIRES_IN = "1d";

    public readonly REFRESH_COOKIE_NAME = "refresh_token";
    public readonly REFRESH_COOKIE_MAX_AGE = 7 * DAY;
    public readonly REFRESH_COOKIE_EXTENDED_MAX_AGE = 30 * DAY;
    public readonly REFRESH_JWT_EXPIRES_IN = "7d";
    public readonly REFRESH_JWT_EXTENDED = "30d";

    private readonly base_cookie_options: CookieOptions;

    constructor(private readonly configService: ConfigService) {
        this.envConfig = configService.getOrThrow<EnvConfig>("env");

        const production = this.envConfig.NODE_ENV === "production";
        this.base_cookie_options = {
            httpOnly: true,
            secure: production,
            sameSite: production ? "none" : "lax",
            path: "/",
        };
    }

    constructAccessCookie(res: Response, token: string) {
        return res.cookie(this.ACCESS_COOKIE_NAME, token, {
            ...this.base_cookie_options,
            maxAge: this.ACCESS_COOKIE_MAX_AGE,
        });
    }

    constructRefreshCookie(
        res: Response,
        token: string,
        remember_me?: boolean,
    ) {
        return res.cookie(this.REFRESH_COOKIE_NAME, token, {
            ...this.base_cookie_options,
            maxAge: remember_me
                ? this.REFRESH_COOKIE_EXTENDED_MAX_AGE
                : this.REFRESH_COOKIE_MAX_AGE,
        });
    }

    destroyAuthCookies(res: Response) {
        res.clearCookie(this.ACCESS_COOKIE_NAME, this.base_cookie_options);
        res.clearCookie(this.REFRESH_COOKIE_NAME, this.base_cookie_options);
    }
}
