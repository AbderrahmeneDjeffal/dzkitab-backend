import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
} from "class-validator";

export class CreateListingDto {
    @ApiProperty({ description: "Book's price" })
    @IsNotEmpty()
    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsInt()
    @Min(20)
    price: number;

    @ApiProperty({ description: "Book's state (scale from 1 to 10)" })
    @IsNotEmpty()
    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsInt({ message: "Book state must have no decimals" })
    @Min(1)
    @Max(10)
    book_state: number;

    @ApiProperty({ description: "Listing's description" })
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
    @MinLength(10, { message: "Description must be at least 10 characters" })
    @MaxLength(200, { message: "Description must be at most 200 characters" })
    description: string;

    @ApiProperty({ description: "The book exists in DZBook database or not" })
    @Transform(({ value }) => !!value)
    @IsBoolean()
    new_book: boolean;

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

    @ApiPropertyOptional({ description: "Book's title" })
    @ValidateIf((o: CreateListingDto) => o.new_book)
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }: { value: string }) =>
        typeof value === "string" ? value.trim() : value,
    )
    title?: string;

    @ApiPropertyOptional({ description: "Book's author" })
    @ValidateIf((o: CreateListingDto) => o.new_book)
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }: { value: string }) =>
        typeof value === "string" ? value.trim() : value,
    )
    author?: string;

    @ApiPropertyOptional({ description: "Book's category" })
    @ValidateIf((o: CreateListingDto) => o.new_book)
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }: { value: string }) =>
        typeof value === "string" ? value.trim() : value,
    )
    category?: string;
}
