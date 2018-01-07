import { NestFactory } from "@nestjs/core";
import { config } from "@utils/config";
import { initExpress } from "./express";
import { ApplicationModule } from "./modules/app.module";
import { ValidationPipe } from "./modules/common/pipes/validation.pipe";
import { systemLogger } from "./modules/common/helper/log";

const bootstrap = async () => {
    const server = initExpress();

    const app = await NestFactory.create(ApplicationModule, server);
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(config.server.port);
    systemLogger.info(`Server Listening ${config.server.port} Port`);
    return app.getHttpServer();
};

export = bootstrap();
