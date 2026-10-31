import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Listing } from "./entities/listing.entity";
import { BooksModule } from "../books/books.module";
import { ListingsService } from "./listings.service";
import { ListingPhotosModule } from "../listing-photos/listing-photos.module";
import { ListingsController } from "./listings.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Listing]),
        BooksModule,
        ListingPhotosModule,
    ],
    providers: [ListingsService],
    controllers: [ListingsController],
    exports: [ListingsService],
})
export class ListingsModule {}
