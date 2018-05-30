import {
    ExpressMiddleware, HttpStatus, Middleware, NestMiddleware
} from "@nestjs/common";
import { config } from "@utils/config";
import multer  = require("multer");

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
