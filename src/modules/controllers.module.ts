import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { UsersController } from "./users/users.controller";
import { AuthController } from "./users/auth.controller";
import { RegexpsController } from "./regexps/regexps.controller";
import { CategroiesController } from "./categroies/categroies.controller";
import { GoodsController } from "./goods/goods.controller";

export const controllers = [
    UsersController, AuthController,
    RegexpsController, CategroiesController, GoodsController
];

@Module({
    controllers
})
export class ControllersModule { }
