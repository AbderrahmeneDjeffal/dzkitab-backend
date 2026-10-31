import { InjectRepository } from "@nestjs/typeorm";
import { Book } from "./entities/book.entity";
import { ILike, Repository } from "typeorm";
import errorHandler from "src/utils/error-handler";
import { NotFoundException } from "@nestjs/common";
import { CreateBook } from "./types/create-book.type";
import { SearchBook } from "./types/search-book.type";

export class BooksService {
    constructor(@InjectRepository(Book) private bookRepo: Repository<Book>) {}

    async create(bookObject: CreateBook) {
        try {
            const book = this.bookRepo.create(bookObject);
            return this.bookRepo.save(book);
        } catch (err) {
            errorHandler(err);
        }
    }

    async findAll() {
        return this.bookRepo.find();
    }

    async find(searchBookObject: SearchBook) {
        const { isbn, title, author, category } = searchBookObject;

        return this.bookRepo.find({
            where: {
                ...(isbn ? { isbn: ILike(`%${isbn}%`) } : {}),
                ...(title ? { title: ILike(`%${title}%`) } : {}),
                ...(author ? { author: ILike(`%${author}%`) } : {}),
                ...(category ? { category: ILike(`%${category}%`) } : {}),
            },
        });
    }

    async findBookByISBN(isbn: string) {
        try {
            const foundBook = await this.bookRepo.findOneBy({ isbn });

            if (!foundBook) {
                throw new NotFoundException("Book not found");
            }

            return foundBook;
        } catch (err) {
            errorHandler(err);
        }
    }

    async remove({ isbn }: Pick<CreateBook, "isbn">) {
        try {
            const result = await this.bookRepo.delete({ isbn });
            if (result.affected === 0) {
                throw new NotFoundException("Book not found");
            }
        } catch (err) {
            errorHandler(err);
        }
    }
}
