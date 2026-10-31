import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Listing } from "../../listings/entities/listing.entity";
import { Offer } from "../../offers/entities/offer.entity";
import { History } from "../../history/entities/history.entity";

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    first_name: string;

    @Column({ nullable: false })
    last_name: string;

    @Column({ length: 50, nullable: false, unique: true })
    email: string;

    @Column({ length: 60, nullable: false })
    password: string;

    @Column({ length: 10, nullable: false, unique: true })
    phone_number: string;

    @OneToMany(() => Listing, (listing) => listing.owner)
    listings: Listing[];

    @OneToMany(() => Offer, (offer) => offer.issuer)
    offers: Offer[];

    @OneToMany(() => History, (history) => history.seller)
    selling_history: History[];

    @OneToMany(() => History, (history) => history.client)
    buying_history: History[];
}
