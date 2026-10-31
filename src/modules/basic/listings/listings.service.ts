import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Listing } from "./entities/listing.entity";
import { Repository } from "typeorm";
import { BooksService } from "../books/books.service";
import { CreateListingDto } from "./dto/create-listing.dto";
import errorHandler from "src/utils/error-handler";
import { SearchListingDto } from "./dto/search-listing.dto";
import { User } from "../users/entities/user.entity";
import { ListingPhotosService } from "../listing-photos/listing-photos.service";
import { UpdateListingDto } from "./dto/update-listing.dto";
import { SearchBookListings } from "./dto/search-book-listings.dto";

@Injectable()
export class ListingsService {
    constructor(
        @InjectRepository(Listing) private listingRepo: Repository<Listing>,
        private readonly booksService: BooksService,
        private readonly listingPhotosService: ListingPhotosService,
    ) {}

    async create(
        createListingDto: CreateListingDto,
        photos: Express.Multer.File[],
        user: User,
    ) {
        try {
            if (!photos || photos.length === 0) {
                throw new BadRequestException("No photos have been provided");
            }

            const { price, book_state, description, new_book, ...bookDto } =
                createListingDto;

            const book = new_book
                ? await this.booksService.create(bookDto)
                : await this.booksService.findBookByISBN(bookDto.isbn);

            const listing = this.listingRepo.create({
                owner: user,
                book,
                price,
                book_state,
                description,
            });
            const savedListing = await this.listingRepo.save(listing);

            for (const photo of photos) {
                await this.listingPhotosService.create(
                    photo.buffer,
                    savedListing,
                );
            }

            return savedListing;
        } catch (err) {
            errorHandler(err);
        }
    }

    /** Known books matching an ISBN (used to auto-fill the "add listing" form) */
    async findBookListings(searchBookListings: SearchBookListings) {
        try {
            const { isbn } = searchBookListings;
            const books = await this.booksService.find({ isbn });
            return books.slice(0, 5);
        } catch (err) {
            errorHandler(err);
        }
    }

    async find(user: User, searchListingDto?: SearchListingDto) {
        try {
            const userId = user.id;

            const qb = this.listingRepo
                .createQueryBuilder("listing")
                .innerJoinAndSelect("listing.book", "book")
                .innerJoin("listing.owner", "owner")
                .addSelect("owner.id")
                .innerJoin("listing.photos", "photos")
                .where("owner.id != :userId", { userId })
                .orderBy("listing.created_at", "DESC");

            if (!searchListingDto) {
                return qb.getMany();
            }

            const {
                min_price,
                max_price,
                book_state,
                isbn,
                title,
                author,
                category,
            } = searchListingDto;

            if (max_price) {
                qb.andWhere("listing.price BETWEEN :min AND :max", {
                    min: min_price ?? 0,
                    max: max_price,
                });
            } else if (min_price) {
                qb.andWhere("listing.price >= :min", { min: min_price });
            }

            if (book_state) {
                qb.andWhere("listing.book_state = :state", {
                    state: book_state,
                });
            }

            if (isbn) {
                qb.andWhere("book.isbn ILIKE :isbn", {
                    isbn: `%${isbn}%`,
                });
            }

            if (title) {
                qb.andWhere("book.title ILIKE :title", {
                    title: `%${title}%`,
                });
            }

            if (author) {
                qb.andWhere("book.author ILIKE :author", {
                    author: `%${author}%`,
                });
            }

            if (category) {
                qb.andWhere("book.category = :category", {
                    category,
                });
            }

            return qb.getMany();
        } catch (err) {
            errorHandler(err);
        }
    }

    async findOne(id: number) {
        try {
            const listing = await this.listingRepo.findOne({
                where: { id },
                relations: ["book", "owner"],
            });

            if (!listing) {
                throw new NotFoundException("Listing not found");
            }

            return listing;
        } catch (err) {
            errorHandler(err);
        }
    }

    async findListingMainPhoto(id: number) {
        try {
            const listing = await this.listingRepo.findOne({
                where: { id },
                relations: ["photos"],
            });

            if (!listing) {
                throw new NotFoundException("Listing not found");
            }

            const main_photo = listing.photos[0];
            return main_photo;
        } catch (error) {
            errorHandler(error);
        }
    }

    async findListingPhotos(id: number) {
        try {
            const listing = await this.listingRepo.findOne({
                where: { id },
                relations: ["photos"],
            });

            if (!listing) {
                throw new NotFoundException("Listing not found");
            }

            // ids only: the image bytes are served by findListingPhotoImage
            return listing.photos
                .map(({ id }) => ({ id }))
                .sort((a, b) => a.id - b.id);
        } catch (error) {
            errorHandler(error);
        }
    }

    async findListingPhotoImage(id: number, index: number) {
        try {
            const photos = await this.listingPhotosService.findAllOf(id);
            const photo = photos[index - 1];

            if (!photo) {
                throw new NotFoundException("Photo not found");
            }

            return photo.photo_data;
        } catch (error) {
            errorHandler(error);
        }
    }

    async getOne(id: number) {
        try {
            const listing = await this.listingRepo.findOne({
                where: { id },
                relations: ["book"],
                loadRelationIds: { relations: ["owner"] },
            });

            if (!listing) {
                throw new NotFoundException("Listing not found");
            }

            return listing;
        } catch (err) {
            errorHandler(err);
        }
    }

    async findMine(owner: User) {
        try {
            const listings = await this.listingRepo
                .createQueryBuilder("listing")
                .innerJoinAndSelect("listing.book", "book")
                .innerJoin("listing.owner", "owner")
                .where("owner.id = :id", { id: owner.id })
                .orderBy("listing.created_at", "DESC")
                .loadRelationCountAndMap("listing.offerCount", "listing.offers")
                .getMany();

            return listings;
        } catch (err) {
            errorHandler(err);
        }
    }

    async updateMine(
        owner: User,
        id: number,
        updateListingDto: UpdateListingDto,
    ) {
        try {
            const listing = await this.listingRepo.findOneBy({ owner, id });

            if (!listing) {
                throw new NotFoundException(
                    "Listing not found or does not belong to you",
                );
            }

            Object.assign(listing, updateListingDto);
            return this.listingRepo.save(listing);
        } catch (err) {
            errorHandler(err);
        }
    }

    async removeMine(owner: User, id: number) {
        try {
            const listing = await this.listingRepo.findOneBy({ owner, id });

            if (!listing) {
                throw new NotFoundException(
                    "Listing not found or does not belong to you",
                );
            }

            const result = await this.listingRepo.delete({ id });

            if (result.affected === 0) {
                throw new InternalServerErrorException(
                    "Listing could not be removed",
                );
            }

            return "Listing removed successfully";
        } catch (err) {
            errorHandler(err);
        }
    }

    async remove(id: number) {
        try {
            const result = await this.listingRepo.delete({ id });

            if (result.affected === 0) {
                throw new NotFoundException("Listing not found");
            }

            return "Listing removed successfully";
        } catch (err) {
            errorHandler(err);
        }
    }
}
