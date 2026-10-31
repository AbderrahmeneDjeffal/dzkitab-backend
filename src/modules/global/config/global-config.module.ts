import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import databaseConfig from "./database.config";
import environmentConfig from "./environment.config";
import jwtConfig from "./jwt.config";
import bcryptConfig from "./bcrypt.config";
import mailerConfig from "./mailer.config";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                databaseConfig,
                environmentConfig,
                jwtConfig,
                bcryptConfig,
                mailerConfig,
            ],
        }),
    ],
})
export class GlobalConfigModule {}
