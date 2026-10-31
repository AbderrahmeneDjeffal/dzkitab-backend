import { IsInt, IsNotEmpty, IsNumber } from "class-validator";

export class CreateConfirmationDto {
    @IsNumber()
    @IsNotEmpty()
    @IsInt()
    offer_id: number;

    @IsNumber()
    @IsNotEmpty()
    @IsInt()
    confirmed_price: number;
}
