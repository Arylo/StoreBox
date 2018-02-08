import { Module, MiddlewaresConsumer, RequestMethod } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";

// region Controllers
import { UsersAdminController } from "./users/users.controller";
import { AuthAdminController } from "./users/auth.controller";
import { RegexpsAdminController } from "./regexps/regexps.controller";
import { CategoriesAdminController } from "./categroies/categroies.controller";
import { GoodsAdminController } from "./goods/goods.controller";
import { FilesController } from "./files/files.controller";
import { GoodsController } from "./files/goods.controller";
import {
    CollectionsAdminController
} from "./collections/collections.controller";
// endregion Controllers

// region Middlewares
import {
    UploadFileMiddleware, UploadFilesMiddleware
} from "./common/middlewares/upload.middleware";
import {
    ApiLoggerMiddleware, DownloadLoggerMiddleware
} from "./common/middlewares/logger.middleware";
import { RolesMiddleware } from "./common/middlewares/roles.middleware";
import {
    ReloadSessionMiddleware
} from "./common/middlewares/reloadSession.middleware";
// endregion Middlewares

// region Services
import { CollectionsService } from "@services/collections";
// endregion Services

export const controllers = [
    FilesController, GoodsController,
    UsersAdminController, AuthAdminController, RegexpsAdminController,
    CategoriesAdminController, GoodsAdminController, CollectionsAdminController
];

@Module({
    controllers,
    components: [ CollectionsService ]
})
export class ControllersModule {
    private uploadFileMethod = {
        path: "/api/v1/goods", method: RequestMethod.POST
    };
    private uploadFilesMethod = {
        path: "/api/v1/goods/collections", method: RequestMethod.POST
    };
    public configure(consumer: MiddlewaresConsumer) {
        consumer
            .apply([ RolesMiddleware, ReloadSessionMiddleware ])
            .forRoutes(...controllers)
            // region Upload
            .apply(UploadFileMiddleware).forRoutes(this.uploadFileMethod)
            .apply(UploadFilesMiddleware).forRoutes(this.uploadFilesMethod)
            // endregion Upload
            // region Log
            .apply([ ApiLoggerMiddleware ])
            .forRoutes(...controllers.filter((item) => {
                return item !== FilesController;
            }))
            .apply([ DownloadLoggerMiddleware ])
            .forRoutes(FilesController);
            // endregion Log
    }
}
