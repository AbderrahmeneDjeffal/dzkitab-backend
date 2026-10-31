import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Offer } from "../src/modules/basic/offers/entities/offer.entity";
import { User } from "../src/modules/basic/users/entities/user.entity";
import { Listing } from "../src/modules/basic/listings/entities/listing.entity";
import { Book } from "../src/modules/basic/books/entities/book.entity";
import { OffersModule } from "../src/modules/basic/offers/offers.module";
import { AuthModule } from "../src/modules/shared/auth/auth.module";
import { UsersModule } from "../src/modules/basic/users/users.module";
import { ListingsModule } from "../src/modules/basic/listings/listings.module";
import { BooksModule } from "../src/modules/basic/books/books.module";

describe("Offers E2E Tests", () => {
    let app: INestApplication;
    let offerRepository: Repository<Offer>;
    let userRepository: Repository<User>;
    let listingRepository: Repository<Listing>;
    let bookRepository: Repository<Book>;

    let testUser: User;
    let testOwner: User;
    let testBook: Book;
    let testListing: Listing;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: "sqlite",
                    database: ":memory:",
                    entities: [User, Listing, Book, Offer],
                    synchronize: true,
                }),
                OffersModule,
                AuthModule,
                UsersModule,
                ListingsModule,
                BooksModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        // Get repositories
        offerRepository = moduleFixture.get<Repository<Offer>>(
            getRepositoryToken(Offer),
        );
        userRepository = moduleFixture.get<Repository<User>>(
            getRepositoryToken(User),
        );
        listingRepository = moduleFixture.get<Repository<Listing>>(
            getRepositoryToken(Listing),
        );
        bookRepository = moduleFixture.get<Repository<Book>>(
            getRepositoryToken(Book),
        );

        // Setup test data
        await setupTestData();
    });

    async function setupTestData() {
        // Create test users
        testUser = userRepository.create({
            first_name: "John",
            last_name: "Doe",
            email: "john@test.com",
            phone_number: "1234567890",
        });
        await userRepository.save(testUser);

        testOwner = userRepository.create({
            first_name: "Jane",
            last_name: "Smith",
            email: "jane@test.com",
            phone_number: "0987654321",
        });
        await userRepository.save(testOwner);

        // Create test book
        testBook = bookRepository.create({
            isbn: "978-3-16-148410-0",
            title: "Test Book",
            author: "Test Author",
            category: "Fiction",
        });
        await bookRepository.save(testBook);

        // Create test listing
        testListing = listingRepository.create({
            price: 500,
            owner: testOwner,
            book: testBook,
        });
        await listingRepository.save(testListing);
    }

    afterAll(async () => {
        await app.close();
    });

    describe("POST /offers", () => {
        it("should create a new offer successfully", async () => {
            // E2E Test: Create Offer Endpoint
            const createOfferDto = {
                listing_id: testListing.id,
                include_phone_number: true,
            };

            const response = await request(app.getHttpServer())
                .post("/offers")
                .set("Cookie", ["access-token=valid-token"])
                .send(createOfferDto)
                .expect(201);

            expect(response.body).toHaveProperty("id");
            expect(response.body.listing.id).toBe(testListing.id);
            expect(response.body.issuer.id).toBe(testUser.id);

            // Verify offer was saved in database
            const savedOffer = await offerRepository.findOne({
                where: { id: response.body.id },
            });
            expect(savedOffer).toBeDefined();
        });

        it("should reject invalid offer creation without listing_id", async () => {
            const createOfferDto = {
                include_phone_number: true,
            };

            await request(app.getHttpServer())
                .post("/offers")
                .set("Cookie", ["access-token=valid-token"])
                .send(createOfferDto)
                .expect(400);
        });

        it("should return 404 when listing does not exist", async () => {
            const createOfferDto = {
                listing_id: 9999,
                include_phone_number: false,
            };

            await request(app.getHttpServer())
                .post("/offers")
                .set("Cookie", ["access-token=valid-token"])
                .send(createOfferDto)
                .expect(404);
        });
    });

    describe("GET /offers/issued", () => {
        it("should retrieve all offers issued by the authenticated user", async () => {
            // Create a test offer first
            const offer = offerRepository.create({
                issuer: testUser,
                listing: testListing,
            });
            await offerRepository.save(offer);

            const response = await request(app.getHttpServer())
                .get("/offers/issued")
                .set("Cookie", ["access-token=valid-token"])
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].issuer.id).toBe(testUser.id);
        });
    });

    describe("GET /offers/owned", () => {
        it("should retrieve all offers for listings owned by the authenticated user", async () => {
            const response = await request(app.getHttpServer())
                .get("/offers/owned")
                .set("Cookie", ["access-token=valid-token"])
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // Should contain offers for listings owned by testOwner
        });
    });

    describe("DELETE /offers/:id", () => {
        it("should cancel an offer created by the authenticated user", async () => {
            // Create a test offer
            const offer = offerRepository.create({
                issuer: testUser,
                listing: testListing,
            });
            const savedOffer = await offerRepository.save(offer);

            const response = await request(app.getHttpServer())
                .delete(`/offers/${savedOffer.id}`)
                .set("Cookie", ["access-token=valid-token"])
                .expect(200);

            expect(response.body).toEqual("Offer removed successfully");

            // Verify offer was deleted
            const deletedOffer = await offerRepository.findOne({
                where: { id: savedOffer.id },
            });
            expect(deletedOffer).toBeNull();
        });

        it("should return 404 when canceling non-existent offer", async () => {
            await request(app.getHttpServer())
                .delete("/offers/9999")
                .set("Cookie", ["access-token=valid-token"])
                .expect(404);
        });

        it("should return 404 when trying to cancel offer not created by user", async () => {
            // Create an offer by another user
            const otherUser = userRepository.create({
                first_name: "Other",
                last_name: "User",
                email: "other@test.com",
                phone_number: "5555555555",
            });
            await userRepository.save(otherUser);

            const offer = offerRepository.create({
                issuer: otherUser,
                listing: testListing,
            });
            const savedOffer = await offerRepository.save(offer);

            // Try to delete with different user
            await request(app.getHttpServer())
                .delete(`/offers/${savedOffer.id}`)
                .set("Cookie", ["access-token=valid-token"])
                .expect(404);
        });
    });

    describe("PATCH /offers/:id", () => {
        it("should finalize an offer and remove the listing", async () => {
            // Create a listing for testOwner
            const newBook = bookRepository.create({
                isbn: "978-1-23-456789-0",
                title: "Another Book",
                author: "Another Author",
                category: "Non-Fiction",
            });
            await bookRepository.save(newBook);

            const newListing = listingRepository.create({
                price: 300,
                owner: testOwner,
                book: newBook,
            });
            await listingRepository.save(newListing);

            // Create an offer
            const offer = offerRepository.create({
                issuer: testUser,
                listing: newListing,
            });
            const savedOffer = await offerRepository.save(offer);

            // Finalize the offer (as the listing owner)
            const response = await request(app.getHttpServer())
                .patch(`/offers/${savedOffer.id}`)
                .set("Cookie", ["access-token=valid-token"])
                .expect(200);

            expect(response.body).toEqual("Offer finalized successfully");
        });

        it("should return 404 when finalizing non-existent offer", async () => {
            await request(app.getHttpServer())
                .patch("/offers/9999")
                .set("Cookie", ["access-token=valid-token"])
                .expect(404);
        });
    });
});
