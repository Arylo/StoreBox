import {
    Middleware, NestMiddleware, ExpressMiddleware, HttpException, HttpStatus
} from "@nestjs/common";
import multer  = require("multer");
import { config } from "@utils/config";
const upload = multer({
    dest: `${config.paths.tmp}/files`
});

@Middleware()
export class UploadMiddleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return upload.array("files");
    }
}
