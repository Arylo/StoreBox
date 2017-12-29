import { Module, MiddlewaresConsumer, RequestMethod } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { UsersController } from "./users/users.controller";
import { AuthController } from "./users/auth.controller";
import { RegexpsController } from "./regexps/regexps.controller";
import { CategroiesController } from "./categroies/categroies.controller";
import { GoodsController } from "./goods/goods.controller";
import { UploadFileMiddleware } from "./upload.middleware";
import { FilesController } from "./files/files.controller";

export const controllers = [
    UsersController, AuthController,
    RegexpsController, CategroiesController, GoodsController,
    FilesController
];

@Module({
    controllers
})
export class ControllersModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer.apply([UploadFileMiddleware])
            .forRoutes(
                { path: "/goods", method: RequestMethod.POST }
            );
    }
}
