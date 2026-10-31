import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
import { UserRegisterDto } from "./user-register.dto";

export class UserLoginDto extends PickType(UserRegisterDto, [
    "email",
    "password",
]) {
    @ApiProperty({ description: "Login's remember me flag", default: false })
    @IsOptional()
    @IsBoolean()
    remember_me?: boolean;
}
