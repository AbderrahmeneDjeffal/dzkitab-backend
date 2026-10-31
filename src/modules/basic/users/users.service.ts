import {
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { BcryptConfig } from "src/modules/global/config/bcrypt.config";
import { ConfigService } from "@nestjs/config";
import { hash } from "bcrypt";
import errorHandler from "src/utils/error-handler";
import { QueryFailedError, Repository } from "typeorm";
import { UserRegisterDto } from "src/modules/shared/auth/dto/user-register.dto";

@Injectable()
export class UsersService {
    private readonly bcryptConfig: BcryptConfig;
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        private readonly configService: ConfigService,
    ) {
        this.bcryptConfig =
            configService.getOrThrow<BcryptConfig>("bcrypt_salt");
    }

    async create(userRegisterDto: UserRegisterDto) {
        try {
            userRegisterDto.password = await hash(
                userRegisterDto.password,
                this.bcryptConfig.salt_rounds,
            );

            const user = this.userRepo.create(userRegisterDto);
            return await this.userRepo.save(user);
        } catch (err) {
            if (
                err instanceof QueryFailedError &&
                (err.driverError as { code?: string })?.code === "23505"
            ) {
                throw new ConflictException(
                    "This email or phone number is already registered",
                );
            }
            errorHandler(err);
        }
    }

    async findAll() {
        return this.userRepo.find();
    }

    async findOne(criteria: Pick<User, "id"> | Pick<User, "email">) {
        const user = await this.userRepo.findOneBy({ ...criteria });

        if (!user) {
            throw new NotFoundException("No user found");
        }

        return user;
    }

    async update(id: number, updateUserDto: Partial<UserRegisterDto>) {
        const user = await this.findOne({ id });

        Object.assign(user, updateUserDto);
        try {
            await this.userRepo.save(user);
            return "User updated successfully";
        } catch (err) {
            errorHandler(err);
        }
    }

    async remove({
        id,
        email,
    }: { id: number; email?: undefined } | { id?: undefined; email: string }) {
        try {
            const result = await this.userRepo.delete(id ? { id } : { email });

            if (result.affected === 0) {
                throw new NotFoundException("User not found");
            }

            return "User removed successfully";
        } catch (err) {
            errorHandler(err);
        }
    }
}
