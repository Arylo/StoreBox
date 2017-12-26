import { Module, MiddlewaresConsumer } from "@nestjs/common";
// Modules
import { DatabaseModule } from "./database/database.module";
import { ControllersModule, controllers } from "./controllers.module";
// Middlewares
import { AuthenticationMiddleware } from "./authentication.middleware";

@Module({
    modules: [DatabaseModule, ControllersModule],
    controllers
})
export class ApplicationModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer.apply(AuthenticationMiddleware)
            .forRoutes(...controllers);
    }
}
