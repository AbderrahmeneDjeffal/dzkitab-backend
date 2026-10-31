import { registerAs } from "@nestjs/config";

export interface DatabaseConfig {
    uri: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}

export default registerAs("database", () => {
    if (!process.env.DB_URI) {
        throw new Error("DB_URI does not exist on your .env");
    }

    if (!process.env.DB_HOST) {
        throw new Error("DB_HOST does not exist on your .env");
    }
    if (!process.env.DB_PORT || isNaN(Number(process.env.DB_PORT))) {
        throw new Error(
            "DB_PORT does not exist on your .env, or is not a number",
        );
    }
    if (!process.env.DB_USERNAME) {
        throw new Error("DB_USERNAME does not exist on your .env");
    }
    if (!process.env.DB_PASSWORD) {
        throw new Error("DB_PASSWORD does not exist on your .env");
    }
    if (!process.env.DB_NAME) {
        throw new Error("DB_NAME does not exist on your .env");
    }

    return {
        uri: process.env.DB_URI,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    };
});
