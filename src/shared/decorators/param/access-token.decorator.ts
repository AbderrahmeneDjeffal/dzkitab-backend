import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const AccessToken = createParamDecorator((_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.cookies["access_token"] as string | undefined;
});
