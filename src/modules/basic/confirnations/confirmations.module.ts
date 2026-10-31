import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Confirmation } from "./entities/confirmation.entity";
import { ConfirmationsService } from "./confirmations.service";
import { OffersModule } from "../offers/offers.module";
import { HistoryModule } from "../history/history.module";
import { ConfirmationsController } from "./confirmations.controller";
import { ListingsModule } from "../listings/listings.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Confirmation]),
        OffersModule,
        HistoryModule,
        ListingsModule,
    ],
    providers: [ConfirmationsService],
    controllers: [ConfirmationsController],
})
export class ConfirmationsModule {}
