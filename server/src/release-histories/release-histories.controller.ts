import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReleaseHistoriesService } from './release-histories.service';

const schema = require('../../../shared/schema');

@Controller()
export class ReleaseHistoriesController {
  constructor(private readonly historiesService: ReleaseHistoriesService) {}

  @Get('releases/:id/histories')
  async findAll(@Param('id', ParseIntPipe) releaseId: number) {
    return this.historiesService.getHistories(releaseId);
  }

  @Post('release-histories')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    const parsed = schema.insertReleaseHistorySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i: any) => i.message).join(', '));
    }
    const history = await this.historiesService.createHistory(parsed.data);
    return { history };
  }

  @Put('release-histories/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const parsed = schema.insertReleaseHistorySchema.partial().safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i: any) => i.message).join(', '));
    }
    const history = await this.historiesService.updateHistory(id, parsed.data);
    if (!history) throw new NotFoundException('History not found');
    return { history };
  }

  @Delete('release-histories/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.historiesService.deleteHistory(id);
    return { message: 'History deleted' };
  }
}
