import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Book } from "../../books/entities/book.entity";
import { Photo } from "../../listing-photos/entites/photo.entity";
import { Offer } from "../../offers/entities/offer.entity";
import { User } from "../../users/entities/user.entity";

@Entity({ name: "listings" })
export class Listing {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    price: number;

    @Column()
    book_state: number;

    @Column({ type: "text" })
    description: string;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => Book, (book) => book.listings)
    book: Book;

    @ManyToOne(() => User, (user) => user.listings)
    owner: User;

    @OneToMany(() => Photo, (photo) => photo.listing)
    photos: Photo[];

    @OneToMany(() => Offer, (offer) => offer.listing)
    offers: Offer[];
}
