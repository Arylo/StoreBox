import { Module, MiddlewaresConsumer } from "@nestjs/common";
// Modules
import { DatabaseModule } from "./database/database.module";
import {controllers, ControllersModule} from "./controllers.module";
import { NoCacheMiddleware } from "./common/middlewares/noCache.middleware";

@Module({
    modules: [ DatabaseModule, ControllersModule ]
})
export class ApplicationModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer
            .apply(NoCacheMiddleware)
            .forRoutes(...controllers);
    }
}
