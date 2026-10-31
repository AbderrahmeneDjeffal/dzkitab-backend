import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Offer } from "./entities/offer.entity";
import { ListingsModule } from "../listings/listings.module";
import { OffersService } from "./offers.service";
import { OffersController } from "./offers.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Offer]), ListingsModule],
    providers: [OffersService],
    controllers: [OffersController],
    exports: [OffersService],
})
export class OffersModule {}
