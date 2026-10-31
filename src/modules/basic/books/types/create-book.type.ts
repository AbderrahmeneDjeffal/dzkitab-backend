import { PickType } from "@nestjs/swagger";
import { CreateListingDto } from "../../listings/dto/create-listing.dto";

export class CreateBook extends PickType(CreateListingDto, [
    "isbn",
    "title",
    "author",
    "category",
]) {}
