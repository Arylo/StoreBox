import { Module, SingleScope } from "@nestjs/common";
import { databaseProviders } from "./database.providers";

@SingleScope()
@Module({
    components: [...databaseProviders],
    exports: [...databaseProviders]
})
export class DatabaseModule { }
