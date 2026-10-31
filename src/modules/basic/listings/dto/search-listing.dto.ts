import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateListingDto } from "./create-listing.dto";
import { IsNumber, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export class SearchListingDto extends PartialType(
    OmitType(CreateListingDto, ["price", "description"]),
) {
    @IsOptional()
    @Transform(({ value }) =>
        typeof value !== "undefined" ? Number(value) : value,
    )
    @IsNumber()
    min_price?: number;

    @IsOptional()
    @Transform(({ value }) =>
        typeof value !== "undefined" ? Number(value) : value,
    )
    @IsNumber()
    max_price?: number;
}
