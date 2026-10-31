import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity({ name: "history" })
export class History {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    client_price: number;

    @Column({ nullable: false })
    seller_price: number;

    @Column({ nullable: false })
    rating: number;

    @Column({ nullable: false })
    rating_description: string;

    @ManyToOne(() => User, (user) => user.selling_history, {
        nullable: false,
        onDelete: "CASCADE",
    })
    seller: User;

    @ManyToOne(() => User, (user) => user.buying_history, {
        nullable: false,
        onDelete: "CASCADE",
    })
    client: User;
}
