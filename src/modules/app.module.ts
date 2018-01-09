import { Module, MiddlewaresConsumer } from "@nestjs/common";
// Modules
import { DatabaseModule } from "./database/database.module";
import { ControllersModule, controllers } from "./controllers.module";
// Controllers
import { FilesController } from "./files/files.controller";
// Middlewares
import {
    AuthenticationMiddleware
} from "./common/middlewares/authentication.middleware";

@Module({
    modules: [ DatabaseModule, ControllersModule ]
})
export class ApplicationModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer.apply(AuthenticationMiddleware)
            .forRoutes(...controllers.filter((item) => {
                return item !== FilesController;
            }));
    }
}
