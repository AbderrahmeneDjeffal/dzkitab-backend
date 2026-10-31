import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Listing } from "../../listings/entities/listing.entity";

@Entity({ name: "photos" })
export class Photo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "bytea" })
    photo_data: Buffer;

    @ManyToOne(() => Listing, (listing) => listing.photos, {
        onDelete: "CASCADE",
    })
    listing: Listing;
}
