import { MailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailerConfig } from "src/modules/global/config/mailer.config";

@Module({
    imports: [
        MailerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const mailer = config.getOrThrow<MailerConfig>("mailer");

                if (!mailer.enabled) {
                    return {
                        transport: { jsonTransport: true },
                        defaults: { from: mailer.auth.user },
                    };
                }

                return {
                    transport: {
                        host: mailer.host,
                        port: mailer.port,
                        secure: mailer.port === 465,
                        auth: mailer.auth,
                    },
                    defaults: { from: mailer.auth.user },
                };
            },
        }),
    ],
})
export class GlobalMailerModule {}
