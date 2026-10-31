import { PartialType } from "@nestjs/swagger";
import { CreateBook } from "./create-book.type";

export class SearchBook extends PartialType(CreateBook) {}
