import { ApiProperty } from "@nestjs/swagger";
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
} from "class-validator";

export class CreateOfferDto {
    @ApiProperty({
        description: "Listing's ID on which the offer has been issued",
    })
    @IsNotEmpty()
    @IsNumber()
    @IsInt()
    listing_id: number;

    @ApiProperty({
        description: "If the offer issuer accepted to include his phone number",
    })
    @IsBoolean()
    @IsOptional()
    include_phone_number?: boolean;
}
