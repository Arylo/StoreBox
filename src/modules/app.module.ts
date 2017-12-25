import { Module, MiddlewaresConsumer, RequestMethod } from "@nestjs/common";
// Modules
import { DatabaseModule } from "./database/database.module";
import { ControllersModule, controllers } from "./controllers.module";
// Middlewares
import { AuthenticationMiddleware } from "./authentication.middleware";
import { UploadMiddleware } from "./upload.middleware";

@Module({
    modules: [DatabaseModule, ControllersModule],
    controllers
})
export class ApplicationModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer.apply(AuthenticationMiddleware)
            .forRoutes(...controllers);
        consumer.apply(UploadMiddleware)
            .forRoutes(
                { path: "/goods", method: RequestMethod.POST }
            );
    }
}
