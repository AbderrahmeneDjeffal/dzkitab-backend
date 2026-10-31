import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { History } from "./entities/history.entity";
import { Repository } from "typeorm";
import errorHandler from "src/utils/error-handler";

@Injectable()
export class HistoryService {
    constructor(
        @InjectRepository(History) private historyRepo: Repository<History>,
    ) {}

    async create(
        client_price: number,
        seller_price: number,
        rating: number,
        rating_description: string,
        seller_id: number,
        client_id: number,
    ) {
        try {
            const historyRecord = this.historyRepo.create({
                client_price,
                seller_price,
                rating,
                rating_description,
                seller: { id: seller_id },
                client: { id: client_id },
            });

            return this.historyRepo.save(historyRecord);
        } catch (err) {
            errorHandler(err);
        }
    }
}
