import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UserLoginDto } from "./dto/user-login.dto";
import type { Response } from "express";
import { UserRegisterDto } from "./dto/user-register.dto";
import { Public } from "src/shared/decorators/public/public.decorator";
import { UserParam } from "src/shared/decorators/param/user-param.decorator";
import { RefreshToken } from "src/shared/decorators/param/refresh-token.decorator";
import { ApiCookieAuth } from "@nestjs/swagger";
import { User } from "src/modules/basic/users/entities/user.entity";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post("login")
    userLogin(
        @Body() userLoginDto: UserLoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.userLogin(userLoginDto, res);
    }

    @Public()
    @Post("register")
    userRegister(
        @Body() userRegisterDto: UserRegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.userRegiser(userRegisterDto, res);
    }

    @Public()
    @Get("refresh")
    refreshAccess(
        @RefreshToken() refresh_token: string | undefined,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.refreshAccess(refresh_token, res);
    }

    @ApiCookieAuth("access-token")
    @Get("me")
    getUserInfo(@UserParam() user: User) {
        return this.authService.getUserInfo(user);
    }

    @Public()
    @Get("logout")
    userLogout(@Res({ passthrough: true }) res: Response) {
        this.authService.userLogout(res);
    }
}
