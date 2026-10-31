import { SetMetadata } from "@nestjs/common";
import { Role } from "src/shared/enums/role.enum";

export const Admin = () => SetMetadata("roles", [Role.MODERATOR, Role.ADMIN]);
