import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Res,
    StreamableFile,
    UploadedFiles,
    UseInterceptors,
} from "@nestjs/common";
import { ListingsService } from "./listings.service";
import { SearchListingDto } from "./dto/search-listing.dto";
import { CreateListingDto } from "./dto/create-listing.dto";
import { User } from "../users/entities/user.entity";
import { UserParam } from "src/shared/decorators/param/user-param.decorator";
import { FilesInterceptor } from "@nestjs/platform-express/multer";
import { UpdateListingDto } from "./dto/update-listing.dto";
import { ApiCookieAuth } from "@nestjs/swagger";
import { SearchBookListings } from "./dto/search-book-listings.dto";
import { Public } from "src/shared/decorators/public/public.decorator";
import type { Response } from "express";

function sniffImageType(buffer: Buffer) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
    if (buffer.subarray(0, 4).toString() === "RIFF") return "image/webp";
    if (buffer.subarray(0, 3).toString() === "GIF") return "image/gif";
    return "application/octet-stream";
}

@ApiCookieAuth("access-token")
@Controller("listings")
export class ListingsController {
    constructor(private readonly listingsService: ListingsService) {}

    @Post()
    @UseInterceptors(
        FilesInterceptor("photos", 4, {
            limits: { fileSize: 5 * 1024 * 1024 },
            fileFilter(req, file, callback) {
                if (!file.mimetype.startsWith("image")) {
                    return callback(
                        new BadRequestException("Invalid file type"),
                        false,
                    );
                }
                callback(null, true);
            },
        }),
    )
    async createListing(
        @Body() createListingDto: CreateListingDto,
        @UploadedFiles() photos: Express.Multer.File[],
        @UserParam() user: User,
    ) {
        await this.listingsService.create(createListingDto, photos, user);
        return "Listing added successfully";
    }

    @Get()
    async getListings(
        @UserParam() user: User,
        @Query() searchListingDto?: SearchListingDto,
    ) {
        return this.listingsService.find(user, searchListingDto);
    }

    @Get("book")
    async getListingByBook(@Query() searchBookListings: SearchBookListings) {
        return this.listingsService.findBookListings(searchBookListings);
    }

    @Get("me")
    async getMyListings(@UserParam() user: User) {
        return this.listingsService.findMine(user);
    }

    @Get(":id")
    async getOneListing(@Param("id", ParseIntPipe) id: number) {
        return this.listingsService.getOne(id);
    }

    @Get(":id/main-photo")
    async getListingMainPhoto(@Param("id", ParseIntPipe) id: number) {
        return this.listingsService.findListingMainPhoto(id);
    }

    @Get(":id/photos")
    async findListingPhotos(@Param("id", ParseIntPipe) id: number) {
        return this.listingsService.findListingPhotos(id);
    }

    /** Public on purpose: it is used directly as an <img src>. */
    @Public()
    @Get(":id/photos/:index/image")
    async getListingPhotoImage(
        @Param("id", ParseIntPipe) id: number,
        @Param("index", ParseIntPipe) index: number,
        @Res({ passthrough: true }) res: Response,
    ) {
        const data = await this.listingsService.findListingPhotoImage(
            id,
            index,
        );
        res.set({
            "Content-Type": sniffImageType(data),
            "Cache-Control": "public, max-age=86400",
            "Cross-Origin-Resource-Policy": "cross-origin",
        });
        return new StreamableFile(data);
    }

    @Patch(":id")
    async updateMyListing(
        @UserParam() user: User,
        @Param("id", ParseIntPipe) id: number,
        @Body() updateListingDto: UpdateListingDto,
    ) {
        return this.listingsService.updateMine(user, id, updateListingDto);
    }

    @Delete(":id")
    async removeMyListing(
        @UserParam() user: User,
        @Param("id", ParseIntPipe) id: number,
    ) {
        return this.listingsService.removeMine(user, id);
    }
}
