import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { ConfigModule } from "@nestjs/config";
import bcryptConfig from "src/modules/global/config/bcrypt.config";

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        ConfigModule.forFeature(bcryptConfig),
    ],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
