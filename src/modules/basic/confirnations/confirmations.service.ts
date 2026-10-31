import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Confirmation } from "./entities/confirmation.entity";
import { Repository } from "typeorm";
import { CreateConfirmationDto } from "./dto/create-confirmation.dto";
import errorHandler from "src/utils/error-handler";
import { User } from "../users/entities/user.entity";
import { OffersService } from "../offers/offers.service";
import { ConfirmBuyingDto } from "./dto/confirm-buying.dto";
import { MailerService } from "@nestjs-modules/mailer";
import { HistoryService } from "../history/history.service";
import { ListingsService } from "../listings/listings.service";

@Injectable()
export class ConfirmationsService {
    constructor(
        @InjectRepository(Confirmation)
        private confirmationRepo: Repository<Confirmation>,
        private readonly offersService: OffersService,
        private readonly mailerService: MailerService,
        private readonly historyService: HistoryService,
        private readonly listingsService: ListingsService,
    ) {}

    async sendConfirmationRejectedMail(
        client: User,
        confirmation: Confirmation,
    ) {
        try {
            const reciever = confirmation.offer.listing.owner.email;
            const { book } = confirmation.offer.listing;

            const subject = `${book.title} Buying Confirmation Rejected`;

            const text = `It looks like, you and the client ${client.first_name} ${client.last_name} have not agreed on the same price, on the listing containing a book with these informations:
            Book ISBN: ${book.isbn}
            Book title: ${book.title}
            Book Author: ${book.author}
            Book Category: ${book.category}`;

            await this.mailerService.sendMail({
                to: reciever,
                subject,
                text,
            });
        } catch (err) {
            errorHandler(err);
        }
    }

    async sendConfirmationAcceptedMail(
        client: User,
        confirmation: Confirmation,
    ) {
        try {
            const reciever = confirmation.offer.listing.owner.email;
            const { book } = confirmation.offer.listing;

            const subject = `${book.title} Buying Confirmation Accepted`;

            const text = `It looks like, you and the client ${client.first_name} ${client.last_name} have agreed on the same price, on the listing containing a book with these informations:
            Book ISBN: ${book.isbn}
            Book title: ${book.title}
            Book Author: ${book.author}
            Book Category: ${book.category}
            
            And therefore we will consider your book as sold.`;

            await this.mailerService.sendMail({
                to: reciever,
                subject,
                text,
            });
        } catch (err) {
            errorHandler(err);
        }
    }

    async open(seller: User, createConfirmationDto: CreateConfirmationDto) {
        try {
            const { offer_id, confirmed_price } = createConfirmationDto;
            const { id } = seller;

            const offer = await this.offersService.findOne(offer_id);

            if (offer.listing.owner.id !== id) {
                throw new UnauthorizedException(
                    "You do not have the permission to access this offer",
                );
            }

            const confirmation = this.confirmationRepo.create({
                offer,
                confirmed_price,
            });
            return this.confirmationRepo.save(confirmation);
        } catch (err) {
            errorHandler(err);
        }
    }

    async findOne(id: number) {
        const qb = this.confirmationRepo
            .createQueryBuilder("confirmation")
            .where("confirmation.id = :id", { id })
            .innerJoinAndSelect("confirmation.offer", "offer")
            .innerJoinAndSelect("offer.listing", "listing")
            .innerJoinAndSelect("listing.book", "book")
            .innerJoin("listing.owner", "owner")
            .innerJoin("offer.issuer", "issuer")
            .addSelect("issuer.id owner.id owner.email");

        const confirmation = await qb.getOne();

        if (!confirmation) {
            throw new NotFoundException("Confirmation not found");
        }

        return confirmation;
    }

    async confirm(
        client: User,
        id: number,
        confirmBuyingDto: ConfirmBuyingDto,
    ) {
        try {
            const { confirmed_price, rating, rating_description } =
                confirmBuyingDto;
            const { id: client_id } = client;

            const confirmation = await this.findOne(id);
            const seller_id = confirmation.offer.listing.owner.id;

            if (confirmation.offer.issuer.id !== client_id) {
                throw new UnauthorizedException(
                    "You do not have permission to confirm this buying",
                );
            }

            await this.historyService.create(
                confirmed_price,
                confirmation.confirmed_price,
                rating,
                rating_description,
                seller_id,
                client_id,
            );

            await this.remove(id);

            if (confirmation.confirmed_price !== confirmed_price) {
                await this.sendConfirmationRejectedMail(client, confirmation);
                return "Buying confirmation rejected: client price and seller price do not match";
            }

            const listing = confirmation.offer.listing;
            await this.listingsService.remove(listing.id);

            await this.sendConfirmationAcceptedMail(client, confirmation);
            return "Buying confirmation accepted";
        } catch (err) {
            errorHandler(err);
        }
    }

    async remove(id: number) {
        try {
            const result = await this.confirmationRepo.delete({ id });

            if (result.affected === 0) {
                throw new NotFoundException("Confirmation not found");
            }
        } catch (err) {
            errorHandler(err);
        }
    }
}
