import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from "@nestjs/common";
import { UserParam } from "src/shared/decorators/param/user-param.decorator";
import { User } from "../users/entities/user.entity";
import { OffersService } from "./offers.service";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { ApiCookieAuth } from "@nestjs/swagger";

@ApiCookieAuth("access-token")
@Controller("offers")
export class OffersController {
    constructor(private readonly offersService: OffersService) {}

    @Post()
    async create(
        @UserParam() user: User,
        @Body() createOfferDto: CreateOfferDto,
    ) {
        await this.offersService.create(user, createOfferDto);
        return "Offer created successfully";
    }

    @Get("issued")
    async getIssuedOffers(@UserParam() user: User) {
        return this.offersService.findWhereIssuer(user);
    }

    @Get("owned")
    async getOwnedOffers(@UserParam() user: User) {
        return this.offersService.findWhereOwner(user);
    }

    @Patch(":id")
    async finalizeMyOwnedOffer(
        @UserParam() user: User,
        @Param("id", ParseIntPipe) id: number,
    ) {
        return this.offersService.finalize(id, user);
    }

    @Delete(":id")
    async cancelMyOffer(
        @UserParam() user: User,
        @Param("id", ParseIntPipe) id: number,
    ) {
        return this.offersService.cancel(user, id);
    }
}
