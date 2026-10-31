import { registerAs } from "@nestjs/config";

export interface JwtConfig {
    access_secret: string;
    refresh_secret: string;
}

export default registerAs("jwt", () => {
    if (!process.env.JWT_ACCESS_SECRET) {
        throw new Error("JWT_ACCESS_SECRET does not exist on your .env");
    }

    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET does not exist on your .env");
    }

    return {
        access_secret: process.env.JWT_ACCESS_SECRET,
        refresh_secret: process.env.JWT_REFRESH_SECRET,
    };
});
