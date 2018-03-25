import { Controller, Get, UseGuards, Put, Body } from "@nestjs/common";
import { SystemService } from "@services/system";
import { RolesGuard } from "@guards/roles";
import { ApiUseTags, ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "@decorators/roles";
import { EditSystemVarDto } from "./system.dto";

@UseGuards(RolesGuard)
@Controller("api/v1/system")
// region Swagger Docs
@ApiUseTags("System")
@ApiBearerAuth()
// endregion Swagger Docs
export class SystemController {

    constructor(private readonly systemSvr: SystemService) { }

    @Roles("guest")
    @Get("/vars")
    public getVars() {
        return this.systemSvr.get();
    }

    @Roles("admin")
    @Put("/vars")
    public setVars(@Body() body: EditSystemVarDto) {
        return this.systemSvr.set(body.key, body.value);
    }

    @Roles("admin")
    @Get("/info")
    public info() {
        return this.systemSvr.info();
    }

}
