import { MiddlewaresConsumer, Module } from "@nestjs/common";
import { NoCacheMiddleware } from "../middlewares/noCache.middleware";
import { controllers, ControllersModule } from "./controllers.module";
import { DatabaseModule } from "./database/database.module";

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
