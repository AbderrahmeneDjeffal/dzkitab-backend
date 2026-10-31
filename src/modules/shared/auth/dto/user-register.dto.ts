import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
    IsBoolean,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MinLength,
} from "class-validator";

export class UserRegisterDto {
    @ApiProperty({ description: "User's first name" })
    @IsString()
    @Transform(({ value }: { value: string }) => value.trim())
    @IsNotEmpty()
    first_name: string;

    @ApiProperty({ description: "User's last name" })
    @IsString()
    @Transform(({ value }: { value: string }) => value.trim())
    @IsNotEmpty()
    last_name: string;

    @ApiProperty({ description: "User's email" })
    @IsString()
    @Transform(({ value }: { value: string }) => value.trim())
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ description: "User's phone number" })
    @IsString()
    @Transform(({ value }: { value: string }) =>
        value.replace(/\s+/g, "").trim(),
    )
    @IsNotEmpty()
    @IsPhoneNumber("DZ")
    phone_number: string;

    @ApiProperty({ description: "User's password" })
    @IsString()
    @Transform(({ value }: { value: string }) => value.trim())
    @IsNotEmpty()
    @MinLength(6, { message: "Password must not be less than 6 characters" })
    password: string;

    @ApiProperty({ description: "Register's remember me flag", default: false })
    @IsOptional()
    @IsBoolean()
    remember_me?: boolean;
}
