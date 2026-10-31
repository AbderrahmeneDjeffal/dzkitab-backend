import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
    NotFoundException,
    InternalServerErrorException,
} from "@nestjs/common";
import { OffersService } from "./offers.service";
import { Offer } from "./entities/offer.entity";
import { ListingsService } from "../listings/listings.service";
import { MailerService } from "@nestjs-modules/mailer";
import { User } from "../users/entities/user.entity";
import { Listing } from "../listings/entities/listing.entity";
import { CreateOfferDto } from "./dto/create-offer.dto";

describe("OffersService", () => {
    let service: OffersService;
    let mockOfferRepository: any;
    let mockListingsService: any;
    let mockMailerService: any;

    const mockUser: User = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone_number: "1234567890",
    } as User;

    const mockListing: Listing = {
        id: 1,
        price: 500,
        owner: { id: 2, email: "owner@example.com" } as User,
        book: {
            isbn: "978-3-16-148410-0",
            title: "Test Book",
            author: "Test Author",
            category: "Fiction",
        } as any,
    } as Listing;

    const mockOffer: Offer = {
        id: 1,
        created_at: new Date(),
        listing: mockListing,
        issuer: mockUser,
    } as Offer;

    beforeEach(async () => {
        mockOfferRepository = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
        };

        mockListingsService = {
            findOne: jest.fn(),
            removeMine: jest.fn(),
        };

        mockMailerService = {
            sendMail: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OffersService,
                {
                    provide: getRepositoryToken(Offer),
                    useValue: mockOfferRepository,
                },
                {
                    provide: ListingsService,
                    useValue: mockListingsService,
                },
                {
                    provide: MailerService,
                    useValue: mockMailerService,
                },
            ],
        }).compile();

        service = module.get<OffersService>(OffersService);
    });

    describe("create", () => {
        it("should create an offer and send email successfully", async () => {
            // Unit Test 1: Successful offer creation with email
            const createOfferDto: CreateOfferDto = {
                listing_id: 1,
                include_phone_number: true,
            };

            mockListingsService.findOne.mockResolvedValue(mockListing);
            mockOfferRepository.create.mockReturnValue(mockOffer);
            mockOfferRepository.save.mockResolvedValue(mockOffer);
            mockMailerService.sendMail.mockResolvedValue(true);

            const result = await service.create(mockUser, createOfferDto);

            expect(mockListingsService.findOne).toHaveBeenCalledWith(1);
            expect(mockOfferRepository.create).toHaveBeenCalledWith({
                issuer: mockUser,
                listing: mockListing,
            });
            expect(mockOfferRepository.save).toHaveBeenCalledWith(mockOffer);
            expect(mockMailerService.sendMail).toHaveBeenCalled();
            expect(result).toEqual(mockOffer);
        });

        it("should throw error when listing not found", async () => {
            // Unit Test 2: Error handling when listing doesn't exist
            const createOfferDto: CreateOfferDto = {
                listing_id: 999,
                include_phone_number: false,
            };

            mockListingsService.findOne.mockRejectedValue(
                new NotFoundException("Listing not found"),
            );

            await expect(
                service.create(mockUser, createOfferDto),
            ).rejects.toBeDefined();
            expect(mockListingsService.findOne).toHaveBeenCalledWith(999);
        });
    });

    describe("findOne", () => {
        it("should return an offer with all relations loaded", async () => {
            // Unit Test 3: Find offer with proper relations
            const mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                innerJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockOffer),
            };

            mockOfferRepository.createQueryBuilder.mockReturnValue(
                mockQueryBuilder,
            );

            const result = await service.findOne(1);

            expect(mockOfferRepository.createQueryBuilder).toHaveBeenCalledWith(
                "offer",
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                "offer.id = :id",
                { id: 1 },
            );
            expect(result).toEqual(mockOffer);
        });

        it("should throw NotFoundException when offer does not exist", async () => {
            // Unit Test 4: Error when offer not found
            const mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                innerJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
            };

            mockOfferRepository.createQueryBuilder.mockReturnValue(
                mockQueryBuilder,
            );

            await expect(service.findOne(999)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe("cancel", () => {
        it("should cancel an offer when it belongs to the issuer", async () => {
            // Unit Test 5: Successful offer cancellation
            mockOfferRepository.findOne.mockResolvedValue(mockOffer);
            mockOfferRepository.delete.mockResolvedValue({ affected: 1 });

            const result = await service.cancel(mockUser, 1);

            expect(mockOfferRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1, issuer: mockUser },
            });
            expect(mockOfferRepository.delete).toHaveBeenCalledWith(mockOffer);
            expect(result).toEqual("Offer removed successfully");
        });

        it("should throw NotFoundException when offer does not belong to issuer", async () => {
            mockOfferRepository.findOne.mockResolvedValue(null);

            try {
                await service.cancel(mockUser, 999);
                fail("Should have thrown an error");
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException);
            }
        });
    });

    describe("finalize", () => {
        it("should finalize an offer and remove listing", async () => {
            mockOfferRepository.findOne.mockResolvedValue(mockOffer);
            mockListingsService.removeMine.mockResolvedValue("Listing removed");

            const result = await service.finalize(1, mockUser);

            expect(mockOfferRepository.findOne).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    listing: { owner: { id: mockUser.id } },
                },
                relations: ["listing"],
            });
            expect(mockListingsService.removeMine).toHaveBeenCalledWith(
                mockUser,
                mockListing.id,
            );
            expect(result).toEqual("Offer finalized successfully");
        });

        it("should throw error when offer does not belong to owner", async () => {
            mockOfferRepository.findOne.mockResolvedValue(null);

            try {
                await service.finalize(999, mockUser);
                fail("Should have thrown an error");
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException);
            }
        });
    });

    describe("findWhereIssuer", () => {
        it("should return all offers issued by a user", async () => {
            mockOfferRepository.find.mockResolvedValue([mockOffer]);

            const result = await service.findWhereIssuer(mockUser);

            expect(mockOfferRepository.find).toHaveBeenCalledWith({
                where: { issuer: mockUser },
                relations: ["listing", "listing.book"],
            });
            expect(result).toEqual([mockOffer]);
        });
    });

    describe("findWhereOwner", () => {
        it("should return all offers for listings owned by a user", async () => {
            mockOfferRepository.find.mockResolvedValue([mockOffer]);

            const result = await service.findWhereOwner(mockUser);

            expect(mockOfferRepository.find).toHaveBeenCalledWith({
                where: { listing: { owner: mockUser } },
                relations: ["listing", "listing.book"],
            });
            expect(result).toEqual([mockOffer]);
        });
    });
});
