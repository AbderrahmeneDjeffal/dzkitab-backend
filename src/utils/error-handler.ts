import { HttpException, InternalServerErrorException } from "@nestjs/common";
import { TypeORMError } from "typeorm";

export default function errorHandler(err: any): never {
    if (err instanceof TypeORMError) {
        throw new InternalServerErrorException(err.message);
    } else if (err instanceof HttpException) {
        throw err;
    } else {
        throw new InternalServerErrorException("An error occured from our end");
    }
}
