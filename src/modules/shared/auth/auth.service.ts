import {
    HttpException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Response } from "express";
import { JwtConfig } from "src/modules/global/config/jwt.config";
import { UserLoginDto } from "./dto/user-login.dto";
import { compare } from "bcrypt";
import { EnvConfig } from "src/modules/global/config/environment.config";
import { UserRegisterDto } from "./dto/user-register.dto";
import { AuthHelper } from "./auth.helper";
import errorHandler from "src/utils/error-handler";
import { UsersService } from "src/modules/basic/users/users.service";
import { Role } from "src/shared/enums/role.enum";
import { User } from "src/modules/basic/users/entities/user.entity";

export type TokenType = "access" | "refresh";

@Injectable()
export class AuthService {
    private readonly jwtConfig: JwtConfig;
    private readonly envConfig: EnvConfig;
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
        private readonly authHelper: AuthHelper,
    ) {
        this.jwtConfig = configService.getOrThrow<JwtConfig>("jwt");
        this.envConfig = configService.getOrThrow<EnvConfig>("env");
    }

    async verifyToken(
        token: string,
        { token_type }: { token_type: TokenType },
    ) {
        try {
            const { user_id, role } = await this.jwtService.verifyAsync<{
                user_id: number;
                role: Role;
            }>(token, {
                secret:
                    token_type === "access"
                        ? this.jwtConfig.access_secret
                        : this.jwtConfig.refresh_secret,
            });
            const user = await this.usersService.findOne({ id: user_id });
            return { user_id, role, user };
        } catch {
            throw new UnauthorizedException("Invalid token");
        }
    }

    async generateAccessToken(payload: { user_id: number; role: Role }) {
        return this.jwtService.signAsync(payload, {
            secret: this.jwtConfig.access_secret,
            expiresIn: this.authHelper.ACCESS_JWT_EXPIRES_IN,
        });
    }

    async generateRefreshToken(
        payload: { user_id: number; role: Role },
        remember_me?: boolean,
    ) {
        return this.jwtService.signAsync(payload, {
            secret: this.jwtConfig.refresh_secret,
            expiresIn: remember_me
                ? this.authHelper.REFRESH_JWT_EXTENDED
                : this.authHelper.REFRESH_JWT_EXPIRES_IN,
        });
    }

    /** Issues both cookies for a freshly authenticated user. */
    private async startSession(
        res: Response,
        user_id: number,
        remember_me?: boolean,
    ) {
        const payload = { user_id, role: Role.BASIC };
        const access_token = await this.generateAccessToken(payload);
        const refresh_token = await this.generateRefreshToken(
            payload,
            remember_me,
        );
        this.authHelper.constructAccessCookie(res, access_token);
        this.authHelper.constructRefreshCookie(res, refresh_token, remember_me);
    }

    /**
     * Resolves the user of a request. Uses the access token, and falls back to
     * the refresh token (re-issuing the access cookie) when it is missing or expired.
     */
    async authenticate(
        access_token: string | undefined,
        refresh_token: string | undefined,
        res: Response,
    ) {
        if (access_token) {
            try {
                const { user } = await this.verifyToken(access_token, {
                    token_type: "access",
                });
                return user;
            } catch {
                // fall through to the refresh token
            }
        }

        if (!refresh_token) {
            throw new UnauthorizedException("Missing access token");
        }

        const { user, user_id, role } = await this.verifyToken(refresh_token, {
            token_type: "refresh",
        });
        const new_access_token = await this.generateAccessToken({
            user_id,
            role,
        });
        this.authHelper.constructAccessCookie(res, new_access_token);
        return user;
    }

    async userLogin(userLoginDto: UserLoginDto, res: Response) {
        try {
            const user = await this.usersService.findOne({
                email: userLoginDto.email,
            });
            const password_matched = await compare(
                userLoginDto.password,
                user.password,
            );
            if (!password_matched) {
                throw new UnauthorizedException("Wrong password");
            }

            await this.startSession(res, user.id, userLoginDto.remember_me);

            res.send("Login successfull");
        } catch {
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    async userRegiser(userRegisterDto: UserRegisterDto, res: Response) {
        try {
            const { remember_me, ...createUserDto } = userRegisterDto;

            const user = await this.usersService.create(createUserDto);

            await this.startSession(res, user.id, remember_me);

            res.send("Register successfull");
        } catch (err) {
            if (err instanceof HttpException) {
                throw err;
            }
            throw new InternalServerErrorException("User register failed");
        }
    }

    async refreshAccess(refresh_token: string | undefined, res: Response) {
        try {
            if (!refresh_token) {
                throw new UnauthorizedException("No refresh token provided");
            }

            const { user_id, role } = await this.verifyToken(refresh_token, {
                token_type: "refresh",
            });

            const access_token = await this.generateAccessToken({
                user_id,
                role,
            });

            this.authHelper.constructAccessCookie(res, access_token);
            return "Access token refreshed";
        } catch (err) {
            if (!(err instanceof HttpException)) {
                throw new UnauthorizedException("Auth refresh failed");
            }
            errorHandler(err);
        }
    }

    getUserInfo(user: User) {
        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            phone_number: user.phone_number,
            email: user.email,
        };
    }

    userLogout(res: Response) {
        try {
            this.authHelper.destroyAuthCookies(res);
            res.send("Logout successful");
        } catch (err) {
            errorHandler(err);
        }
    }
}
