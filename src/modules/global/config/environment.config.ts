import { registerAs } from "@nestjs/config";

export interface EnvConfig {
    NODE_ENV: "development" | "production";
}

export default registerAs("env", () => {
    if (!process.env.NODE_ENV) {
        throw new Error("NODE_ENV does not exist in .env");
    }
    if (
        process.env.NODE_ENV !== "development" &&
        process.env.NODE_ENV !== "production"
    ) {
        throw new Error("NODE_ENV is neither 'development' nor 'production'");
    }

    return {
        NODE_ENV: process.env.NODE_ENV,
    };
});
