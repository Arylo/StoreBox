import { Module, MiddlewaresConsumer } from "@nestjs/common";
// Modules
import { DatabaseModule } from "./database/database.module";
import {controllers, ControllersModule} from "./controllers.module";
import { Clear304Middleware } from "./common/middlewares/clear304.middleware";

@Module({
    modules: [ DatabaseModule, ControllersModule ]
})
export class ApplicationModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer
            .apply(Clear304Middleware)
            .forRoutes(...controllers);
    }
}
