import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Confirmation } from "../../confirnations/entities/confirmation.entity";
import { Listing } from "../../listings/entities/listing.entity";
import { User } from "../../users/entities/user.entity";

@Entity({ name: "offers" })
export class Offer {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    created_at: Date;

    @Column({ type: "boolean", default: false })
    include_phone_number: boolean;

    @ManyToOne(() => Listing, (listing) => listing.offers, {
        onDelete: "CASCADE",
    })
    listing: Listing;

    @ManyToOne(() => User, (user) => user.offers, { onDelete: "CASCADE" })
    issuer: User;

    @OneToOne(() => Confirmation, (confirmation) => confirmation.offer)
    confirmation?: Confirmation;
}
