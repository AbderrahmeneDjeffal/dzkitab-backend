import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import jwtConfig, { JwtConfig } from "src/modules/global/config/jwt.config";
import environmentConfig from "src/modules/global/config/environment.config";
import { AuthHelper } from "./auth.helper";
import { UsersModule } from "src/modules/basic/users/users.module";

@Module({
    imports: [
        UsersModule,
        ConfigModule.forFeature(jwtConfig),
        ConfigModule.forFeature(environmentConfig),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const jwt = config.getOrThrow<JwtConfig>("jwt");
                return {
                    secret: jwt.access_secret,
                    signOptions: { expiresIn: "15m" },
                };
            },
        }),
    ],
    providers: [AuthService, AuthHelper],
    controllers: [AuthController],
    exports: [AuthService, AuthHelper],
})
export class AuthModule {}
