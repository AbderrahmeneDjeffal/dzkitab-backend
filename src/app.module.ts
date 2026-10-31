import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GlobalConfigModule } from "./modules/global/config/global-config.module";
import { ConfigService } from "@nestjs/config";
import type { DatabaseConfig } from "./modules/global/config/database.config";
import type { EnvConfig } from "./modules/global/config/environment.config";
import { APP_GUARD } from "@nestjs/core";
import { BooksModule } from "./modules/basic/books/books.module";
import { ConfirmationsModule } from "./modules/basic/confirnations/confirmations.module";
import { HistoryModule } from "./modules/basic/history/history.module";
import { ListingPhotosModule } from "./modules/basic/listing-photos/listing-photos.module";
import { ListingsModule } from "./modules/basic/listings/listings.module";
import { OffersModule } from "./modules/basic/offers/offers.module";
import { UsersModule } from "./modules/basic/users/users.module";
import { GlobalMailerModule } from "./modules/global/mailer/global-mailer.module";
import { AuthGuard } from "./modules/shared/auth/auth.guard";
import { AuthModule } from "./modules/shared/auth/auth.module";

@Module({
    imports: [
        GlobalConfigModule,
        GlobalMailerModule,
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const db = config.getOrThrow<DatabaseConfig>("database");
                const env = config.getOrThrow<EnvConfig>("env");

                if (env.NODE_ENV === "development") {
                    return {
                        type: "postgres",
                        host: db.host,
                        port: db.port,
                        username: db.username,
                        password: db.password,
                        database: db.database,
                        autoLoadEntities: true,
                        synchronize: process.env.DB_SYNC === "true",
                    };
                }

                return {
                    type: "postgres",
                    url: db.uri,
                    autoLoadEntities: true,
                    synchronize: false,
                };
            },
        }),
        UsersModule,
        AuthModule,
        ListingsModule,
        ListingPhotosModule,
        BooksModule,
        OffersModule,
        ConfirmationsModule,
        HistoryModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AppModule {}
