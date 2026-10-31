import { registerAs } from "@nestjs/config";

export interface BcryptConfig {
    salt_rounds: number;
}

export default registerAs<BcryptConfig>("bcrypt_salt", () => {
    if (!process.env.SALT_ROUNDS) {
        throw new Error("SALT_ROUNDS does not exist on your .env");
    }

    return {
        salt_rounds: Number(process.env.SALT_ROUNDS),
    };
});
