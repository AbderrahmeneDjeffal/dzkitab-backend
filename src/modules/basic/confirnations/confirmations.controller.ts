import { Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { CreateConfirmationDto } from "./dto/create-confirmation.dto";
import { UserParam } from "src/shared/decorators/param/user-param.decorator";
import { User } from "../users/entities/user.entity";
import { ConfirmationsService } from "./confirmations.service";
import { ConfirmBuyingDto } from "./dto/confirm-buying.dto";

@Controller("confirmations")
export class ConfirmationsController {
    constructor(private readonly confirmationsService: ConfirmationsService) {}

    @Post()
    async openConfirmation(
        @UserParam() user: User,
        createConfirmationDto: CreateConfirmationDto,
    ) {
        await this.confirmationsService.open(user, createConfirmationDto);
        return "Confirmation request opened successfully";
    }

    @Post(":id/confirm")
    async confirmBuying(
        @UserParam() user: User,
        @Param("id", ParseIntPipe) id: number,
        confirmBuyingDto: ConfirmBuyingDto,
    ) {
        return this.confirmationsService.confirm(user, id, confirmBuyingDto);
    }
}
