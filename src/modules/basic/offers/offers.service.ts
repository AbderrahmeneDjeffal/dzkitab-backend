import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Offer } from "./entities/offer.entity";
import { User } from "../users/entities/user.entity";
import { CreateOfferDto } from "./dto/create-offer.dto";
import errorHandler from "src/utils/error-handler";
import { ListingsService } from "../listings/listings.service";
import { MailerService } from "@nestjs-modules/mailer";
import { Listing } from "../listings/entities/listing.entity";

@Injectable()
export class OffersService {
    private readonly logger = new Logger(OffersService.name);

    constructor(
        @InjectRepository(Offer) private offerRepo: Repository<Offer>,
        private readonly listingsService: ListingsService,
        private readonly mailerService: MailerService,
    ) {}

    async sendOfferEmail(
        issuer: User,
        listing: Listing,
        include_phone_number?: boolean,
    ) {
        try {
            const { first_name, last_name, email, phone_number } = issuer;
            const book = listing.book;

            const reciever = listing.owner.email;

            const subject = `You recieved an offer on your listing!`;

            const text = `You have recieved an offer on your listing, which includes the book with these informations:
                Book ISBN: ${book.isbn}
                Book title: ${book.title}
                Book author: ${book.author}
                Book category: ${book.category}
                
            Your are proposing to buy your book with DZD${listing.price}, and the client want to make more negotiations.
            Client informations:
                Name: ${first_name} ${last_name}
                Email: ${email}
                ${include_phone_number ? `Phone number: ${phone_number}` : ""}`;

            await this.mailerService.sendMail({
                to: reciever,
                subject,
                text,
            });
        } catch (err) {
            // The offer is already saved: a mail problem must never fail the request
            this.logger.warn(
                `Offer e-mail could not be sent: ${(err as Error)?.message}`,
            );
        }
    }

    async create(issuer: User, createOfferDto: CreateOfferDto) {
        try {
            const { listing_id, include_phone_number } = createOfferDto;
            const listing = await this.listingsService.findOne(listing_id);

            if (listing.owner.id === issuer.id) {
                throw new BadRequestException(
                    "You cannot send an offer on your own listing",
                );
            }

            const existing = await this.offerRepo.findOne({
                where: {
                    issuer: { id: issuer.id },
                    listing: { id: listing.id },
                },
            });
            if (existing) {
                throw new ConflictException(
                    "You already sent an offer on this listing",
                );
            }

            const offer = this.offerRepo.create({
                issuer,
                listing,
                include_phone_number: !!include_phone_number,
            });
            const savedOffer = await this.offerRepo.save(offer);

            // fire and forget: never block (or fail) the response on SMTP
            void this.sendOfferEmail(issuer, listing, include_phone_number);

            return savedOffer;
        } catch (err) {
            errorHandler(err);
        }
    }

    async findOne(id: number) {
        const qb = this.offerRepo
            .createQueryBuilder("offer")
            .where("offer.id = :id", { id })
            .innerJoinAndSelect("offer.listing", "listing")
            .innerJoinAndSelect("offer.issuer", "issuer")
            .innerJoinAndSelect("listing.book", "book")
            .innerJoin("listing.owner", "owner")
            .addSelect("owner.id");

        const offer = await qb.getOne();

        if (!offer) {
            throw new NotFoundException("Offer not found");
        }

        return offer;
    }

    async findWhereIssuer(issuer: User) {
        try {
            return await this.offerRepo.find({
                where: { issuer: { id: issuer.id } },
                relations: { listing: { book: true, owner: true } },
                select: {
                    id: true,
                    created_at: true,
                    include_phone_number: true,
                    listing: {
                        id: true,
                        price: true,
                        book_state: true,
                        description: true,
                        book: {
                            isbn: true,
                            title: true,
                            author: true,
                            category: true,
                        },
                        owner: { id: true, first_name: true, last_name: true },
                    },
                },
                order: { created_at: "DESC" },
            });
        } catch (err) {
            errorHandler(err);
        }
    }

    async findWhereOwner(owner: User) {
        try {
            const offers = await this.offerRepo.find({
                where: { listing: { owner: { id: owner.id } } },
                relations: { listing: { book: true }, issuer: true },
                select: {
                    id: true,
                    created_at: true,
                    include_phone_number: true,
                    listing: {
                        id: true,
                        price: true,
                        book_state: true,
                        description: true,
                        book: {
                            isbn: true,
                            title: true,
                            author: true,
                            category: true,
                        },
                    },
                    issuer: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                order: { created_at: "DESC" },
            });

            // the buyer's phone number is only shared when he agreed to it
            return offers.map((offer) => ({
                ...offer,
                issuer: {
                    id: offer.issuer.id,
                    first_name: offer.issuer.first_name,
                    last_name: offer.issuer.last_name,
                    email: offer.issuer.email,
                    phone_number: offer.include_phone_number
                        ? offer.issuer.phone_number
                        : null,
                },
            }));
        } catch (err) {
            errorHandler(err);
        }
    }

    async cancel(issuer: User, offer_id: number) {
        try {
            const offer = await this.offerRepo.findOne({
                where: { id: offer_id, issuer: { id: issuer.id } },
            });

            if (!offer) {
                throw new NotFoundException(
                    "Offer not found or it does not belong to you",
                );
            }

            const result = await this.offerRepo.delete({ id: offer.id });

            if (result.affected === 0) {
                throw new InternalServerErrorException(
                    "Offer could not be removed",
                );
            }

            return "Offer removed successfully";
        } catch (err) {
            errorHandler(err);
        }
    }

    async remove(id: number) {
        try {
            const result = await this.offerRepo.delete({ id });

            if (result.affected === 0) {
                throw new NotFoundException("Offer not found");
            }

            return "Offer removed successfully";
        } catch (err) {
            errorHandler(err);
        }
    }

    async finalize(id: number, owner: User) {
        try {
            const offer = await this.offerRepo.findOne({
                where: { id, listing: { owner: { id: owner.id } } },
                relations: ["listing"],
            });

            if (!offer) {
                throw new NotFoundException(
                    "Offer not found or it does not belong to you",
                );
            }

            await this.listingsService.removeMine(owner, offer.listing.id);

            return "Offer finalized successfully";
        } catch (error) {
            errorHandler(error);
        }
    }
}
