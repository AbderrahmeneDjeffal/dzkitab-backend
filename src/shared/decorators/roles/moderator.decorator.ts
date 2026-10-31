import { SetMetadata } from "@nestjs/common";
import { Role } from "src/shared/enums/role.enum";

export const Moderator = () => SetMetadata("roles", [Role.MODERATOR]);
