import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { config } from "@utils/config";
import { initExpress } from "./express";
import { ApplicationModule } from "./modules/app.module";
import { ValidationPipe } from "@pipes/validation";
import { systemLogger } from "./modules/common/helper/log";
import { isDevelopment } from "./modules/common/helper/env";

const bootstrap = async () => {
    const server = initExpress();

    const app = await NestFactory.create(ApplicationModule, server, { });
    app.useGlobalPipes(new ValidationPipe());

    if (isDevelopment) {
        const options = new DocumentBuilder()
            .setTitle("StoreBox Apis")
            .setVersion("1.0.0")
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, options);
        SwaggerModule.setup("/docs", app, document);
        systemLogger.debug("Api Document path in `/docs`");
    }

    await app.listen(config.server.port);
    systemLogger.info(`Server Listening ${config.server.port} Port`);
    return app.getHttpServer();
};

export = bootstrap();
