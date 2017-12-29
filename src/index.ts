import { NestFactory } from "@nestjs/core";
import { config } from "@utils/config";
import { initExpress } from "./express";
import { ApplicationModule } from "./modules/app.module";
import { ValidationPipe } from "./modules/common/pipes/validation.pipe";

const bootstrap = async () => {
    const server = initExpress();

    const app = await NestFactory.create(ApplicationModule, server);
    app.setGlobalPrefix("/api/v1");
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(config.server.port);
    return app.getHttpServer();
};

export = bootstrap();
