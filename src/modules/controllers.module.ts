import { Module, MiddlewaresConsumer, RequestMethod } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";

import { UsersAdminController } from "./users/users.controller";
import { AuthAdminController } from "./users/auth.controller";
import { RegexpsAdminController } from "./regexps/regexps.controller";
import { CategoriesAdminController } from "./categroies/categroies.controller";
import { GoodsAdminController } from "./goods/goods.controller";
import { FilesController } from "./files/files.controller";
import { GoodsController } from "./files/goods.controller";

import { UploadFileMiddleware } from "./common/middlewares/upload.middleware";
import {
    ApiLoggerMiddleware, DownloadLoggerMiddleware
} from "./common/middlewares/logger.middleware";
import { RolesMiddleware } from "./common/middlewares/roles.middleware";
import {
    ReloadSessionMiddleware
} from "./common/middlewares/reloadSession.middleware";

export const controllers = [
    FilesController, GoodsController,
    UsersAdminController, AuthAdminController, RegexpsAdminController,
    CategoriesAdminController, GoodsAdminController
];

@Module({
    controllers
})
export class ControllersModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer
            .apply(RolesMiddleware)
            .forRoutes(...controllers)
            .apply(ReloadSessionMiddleware)
            .forRoutes(...controllers)
            .apply([ UploadFileMiddleware ])
            .forRoutes(
                { path: "/api/v1/goods", method: RequestMethod.POST }
            )
            .apply([ ApiLoggerMiddleware ])
            .forRoutes(...controllers.filter((item) => {
                return item !== FilesController;
            }))
            .apply([ DownloadLoggerMiddleware ])
            .forRoutes(FilesController);
    }
}
