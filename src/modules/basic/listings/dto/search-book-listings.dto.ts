import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { CreateListingDto } from "./create-listing.dto";
import { Transform } from "class-transformer";

export class SearchBookListings {
    @ApiPropertyOptional({
        description: "Book's special identifier known as ISBN",
        example: "978-0-306-40615-7",
    })
    @IsString()
    @IsNotEmpty()
    @ValidateIf(
        (o: CreateListingDto) =>
            typeof o.isbn === "string"
                ? o.isbn.length === 10 || o.isbn.length === 13
                : true,
        { message: "ISBN must be 10 or 13 characters long" },
    )
    @Transform(({ value }: { value: string }) =>
        typeof value === "string" ? value.trim() : value,
    )
    isbn: string;
}
