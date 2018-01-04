import { Module, MiddlewaresConsumer, RequestMethod } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";

import { UsersController } from "./users/users.controller";
import { AuthController } from "./users/auth.controller";
import { RegexpsController } from "./regexps/regexps.controller";
import { CategroiesController } from "./categroies/categroies.controller";
import { GoodsController } from "./goods/goods.controller";
import { FilesController } from "./files/files.controller";

import { UploadFileMiddleware } from "./common/middlewares/upload.middleware";
import {
    ApiLoggerMiddleware, DownloadLoggerMiddleware
} from "./common/middlewares/logger.middleware";

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
        consumer
            .apply([ UploadFileMiddleware ])
            .forRoutes(
                { path: "/goods", method: RequestMethod.POST }
            )
            .apply([ ApiLoggerMiddleware ])
            .forRoutes(...controllers.filter((item) => {
                return item !== FilesController;
            }))
            .apply([ DownloadLoggerMiddleware ])
            .forRoutes(FilesController);
    }
}
