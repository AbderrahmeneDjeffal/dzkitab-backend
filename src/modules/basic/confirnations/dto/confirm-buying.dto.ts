import { PickType } from "@nestjs/swagger";
import { CreateConfirmationDto } from "./create-confirmation.dto";
import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
} from "class-validator";

export class ConfirmBuyingDto extends PickType(CreateConfirmationDto, [
    "confirmed_price",
]) {
    @IsNumber()
    @IsInt()
    @IsNotEmpty()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @IsNotEmpty()
    @MinLength(10, {
        message: "Rating description must be at least 10 characters",
    })
    @MaxLength(100, {
        message: "Rating description must be at least 100 characters",
    })
    rating_description: string;
}
