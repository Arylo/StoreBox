import { Module, MiddlewaresConsumer, RequestMethod } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";

// region Controllers
import { UsersAdminController } from "./admin/users/users.controller";
import { AuthAdminController } from "./admin/users/auth.controller";
import { RegexpsAdminController } from "./admin/regexps/regexps.controller";
import {
    CategoriesAdminController
} from "./admin/categroies/categroies.controller";
import { GoodsAdminController } from "./admin/goods/goods.controller";
import { FilesController } from "./public/files/files.controller";
import { GoodsController } from "./public/goods/goods.controller";
import {
    CollectionsController
} from "./public/collections/collections.controller";
import {
    CollectionsAdminController
} from "./admin/collections/collections.controller";
import {
    TokensAdminController
} from "./admin/tokens/tokens.controller";
import {
    UsergroupsAdminController
} from "./admin/usergroups/usergroups.controller";
import { SystemController } from "./admin/system/system.controller";
// endregion Controllers

// region Middlewares
import {
    UploadFileMiddleware, UploadFilesMiddleware
} from "../middlewares/upload.middleware";
import {
    ApiLoggerMiddleware, DownloadLoggerMiddleware
} from "../middlewares/logger.middleware";
import { RolesMiddleware } from "../middlewares/roles.middleware";
import {
    ReloadSessionMiddleware
} from "../middlewares/reloadSession.middleware";
// endregion Middlewares

// region Services
import { RegexpsService } from "@services/regexps";
import { CollectionsService } from "@services/collections";
import { UsersService } from "@services/users";
import { TokensService } from "@services/tokens";
import { UsergroupsService } from "@services/usergroups";
import { SystemService } from "@services/system";
import { CategoriesService } from "@services/categories";
import { GoodsService } from "@services/goods";
import { LogsService } from "@services/logs";
// endregion Services

export const controllers = [
    FilesController, GoodsController,
    UsersAdminController, AuthAdminController,
    UsergroupsAdminController,
    RegexpsAdminController,
    CategoriesAdminController, GoodsAdminController,
    TokensAdminController,
    CollectionsController, CollectionsAdminController,
    SystemController
];

export const services = [
    RegexpsService, CategoriesService, GoodsService,
    CollectionsService, TokensService, UsersService, UsergroupsService,
    SystemService, LogsService
];

@Module({
    controllers,
    components: [ ...services ]
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
