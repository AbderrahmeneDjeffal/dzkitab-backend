import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Photo } from "./entites/photo.entity";
import { Repository } from "typeorm";
import errorHandler from "src/utils/error-handler";
import { Listing } from "../listings/entities/listing.entity";
import { User } from "../users/entities/user.entity";

@Injectable()
export class ListingPhotosService {
    constructor(
        @InjectRepository(Photo) private photoRepo: Repository<Photo>,
    ) {}

    async create(photo_data: Buffer, listing: Listing) {
        try {
            const photo = this.photoRepo.create({ photo_data, listing });
            return this.photoRepo.save(photo);
        } catch (err) {
            errorHandler(err);
        }
    }

    async findAllOf(listing_id: number) {
        return this.photoRepo.find({
            where: { listing: { id: listing_id } },
            order: { id: "ASC" },
        });
    }

    async findOne(listing_id: number, index: number) {
        try {
            if (index > 4 || index < 1) {
                throw new BadRequestException("Photo index out of range");
            }

            const photos = await this.photoRepo.find({
                where: { listing: { id: listing_id } },
            });
            return photos[index - 1];
        } catch (err) {
            errorHandler(err);
        }
    }

    async removeMine(owner: User, listing_id: number, index: number) {
        try {
            if (index < 1 || index > 4) {
                throw new BadRequestException("Index out of range");
            }

            const photos = await this.photoRepo.find({
                where: { listing: { id: listing_id, owner } },
            });

            if (photos.length === 0) {
                throw new NotFoundException(
                    "This listing photo is not found or it does not belong to you",
                );
            }

            const result = await this.photoRepo.delete(photos[index - 1]);

            if (result.affected === 0) {
                throw new InternalServerErrorException(
                    "Photo could not be removed",
                );
            }

            return "Photo removed successfully";
        } catch (err) {
            errorHandler(err);
        }
    }

    async remove(id: number) {
        try {
            const result = await this.photoRepo.delete({ id });

            if (result.affected === 0) {
                throw new NotFoundException("Photo not found");
            }

            return "Photo removed successfully";
        } catch (err) {
            errorHandler(err);
        }
    }
}
