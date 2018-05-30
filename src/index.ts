import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@pipes/validation";
import { config } from "@utils/config";
import { isDevelopment } from "@utils/env";
import { systemLogger } from "@utils/log";
import { initExpress } from "./express";
import { ApplicationModule } from "./modules/app.module";

const bootstrap = async () => {
    const server = initExpress();

    const app = await NestFactory.create(ApplicationModule, server, {
        cors: true
    });
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
