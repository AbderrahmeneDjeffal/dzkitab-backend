import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { User } from "src/modules/basic/users/entities/user.entity";
import { AuthHelper } from "./auth.helper";

declare module "express" {
    interface Request {
        user: User;
    }
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly authService: AuthService,
        private readonly authHelper: AuthHelper,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPubic = this.reflector.getAllAndOverride<boolean>("is_public", [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPubic) return true;

        const http = context.switchToHttp();
        const req = http.getRequest<Request>();
        const res = http.getResponse<Response>();

        const access_token = req.cookies?.[this.authHelper.ACCESS_COOKIE_NAME] as
            | string
            | undefined;
        const refresh_token = req.cookies?.[
            this.authHelper.REFRESH_COOKIE_NAME
        ] as string | undefined;

        req.user = await this.authService.authenticate(
            access_token,
            refresh_token,
            res,
        );

        return true;
    }
}
