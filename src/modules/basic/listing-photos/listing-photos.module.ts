import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Photo } from "./entites/photo.entity";
import { ListingPhotosService } from "./listing-photos.service";

@Module({
    imports: [TypeOrmModule.forFeature([Photo])],
    providers: [ListingPhotosService],
    exports: [ListingPhotosService],
})
export class ListingPhotosModule {}
