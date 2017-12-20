import { Module, MiddlewaresConsumer } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { UsersController } from "./users/users.controller";
import { AuthController } from "./users/auth.controller";
import { AuthenticationMiddleware } from "./authentication.middleware";
import { RegexpsController } from "./regexps/regexps.controller";
import { CategroiesController } from "./categroies/categroies.controller";
import { GoodsController } from "./goods/goods.controller";

const controllers = [
    UsersController, AuthController,
    RegexpsController, CategroiesController, GoodsController
];

@Module({
    modules: [DatabaseModule],
    controllers
})
export class ApplicationModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer.apply(AuthenticationMiddleware)
            .forRoutes(...controllers);
    }
}
