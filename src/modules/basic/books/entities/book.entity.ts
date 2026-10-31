import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Listing } from "../../listings/entities/listing.entity";

@Entity({ name: "books" })
export class Book {
    @PrimaryColumn({ type: "varchar", length: 13 })
    isbn: string;

    @Column()
    title: string;

    @Column()
    author: string;

    @Column()
    category: string;

    @OneToMany(() => Listing, (listing) => listing.book)
    listings: Listing[];
}
