import {
    Middleware, NestMiddleware, ExpressMiddleware, HttpException, HttpStatus
} from "@nestjs/common";
import multer  = require("multer");
import { config } from "@utils/config";

@Middleware()
export class UploadFileMiddleware implements NestMiddleware {
    public resolve(): (req, res, next) => void {
        const upload = multer({ dest: `${config.paths.tmp}/files` });
        return upload.single("file");
    }
}

@Middleware()
export class UploadFilesMiddleware implements NestMiddleware {
    public resolve(): (req, res, next) => void {
        const upload = multer({ dest: `${config.paths.tmp}/files` });
        return upload.array("files");
    }
}
