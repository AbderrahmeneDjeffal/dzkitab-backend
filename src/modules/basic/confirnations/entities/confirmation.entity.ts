import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Offer } from "../../offers/entities/offer.entity";

@Entity({ name: "confirmations" })
export class Confirmation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    confirmed_price: number;

    @CreateDateColumn()
    created_at: Date;

    @OneToOne(() => Offer, (offer) => offer.confirmation, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn()
    offer: Offer;
}
