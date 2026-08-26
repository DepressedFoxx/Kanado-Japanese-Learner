import { Body, Controller, Delete, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SyncDto } from "./dto/progress.dto";
import { ProgressService } from "./progress.service";

@Controller("progress")
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get()
  snapshot(@CurrentUser() user: AuthUser) {
    return this.progress.snapshot(user.userId);
  }

  @Get("summary")
  summary(@CurrentUser() user: AuthUser) {
    return this.progress.summary(user.userId);
  }

  @Post("sync")
  @HttpCode(200)
  sync(@CurrentUser() user: AuthUser, @Body() dto: SyncDto) {
    return this.progress.sync(user.userId, dto);
  }

  @Delete()
  reset(@CurrentUser() user: AuthUser) {
    return this.progress.reset(user.userId);
  }
}
