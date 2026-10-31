import { registerAs } from "@nestjs/config";

export interface MailerConfig {
    /** false when no SMTP server is configured: e-mails are only logged */
    enabled: boolean;
    host: string;
    port: number;
    auth: { user: string; pass: string };
}

export default registerAs<MailerConfig>("mailer", () => {
    const { MAILER_HOST, MAILER_PORT, MAILER_USER, MAILER_PASSWORD } =
        process.env;

    if (!MAILER_HOST || !MAILER_USER || !MAILER_PASSWORD) {
        // Not configured: the app still works, e-mails are just printed in the logs
        return {
            enabled: false,
            host: "",
            port: 587,
            auth: { user: "no-reply@dzkitab.local", pass: "" },
        };
    }

    if (!MAILER_PORT || isNaN(Number(MAILER_PORT))) {
        throw new Error("MAILER_PORT must be a number");
    }

    return {
        enabled: true,
        host: MAILER_HOST,
        port: Number(MAILER_PORT),
        auth: { user: MAILER_USER, pass: MAILER_PASSWORD },
    };
});
