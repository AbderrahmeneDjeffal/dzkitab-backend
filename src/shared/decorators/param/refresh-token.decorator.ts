import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const RefreshToken = createParamDecorator((_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.cookies["refresh_token"] as string | undefined;
});
