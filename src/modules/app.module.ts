import { Module } from "@nestjs/common";
// Modules
import { DatabaseModule } from "./database/database.module";
import { ControllersModule } from "./controllers.module";

@Module({
    modules: [ DatabaseModule, ControllersModule ]
})
export class ApplicationModule { }
