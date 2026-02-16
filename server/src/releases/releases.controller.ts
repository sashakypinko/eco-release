import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { RequirePermission } from '../guards/permission.guard';

const schema = require('../../../shared/schema');

@Controller('releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  @RequirePermission('release:view')
  async findAll(
    @Query('product_id') productId?: string,
    @Query('user_id') userId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    const filters = {
      productId: productId ? Number(productId) : undefined,
      userId: userId ? Number(userId) : undefined,
      status: status || undefined,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
    };
    return this.releasesService.getReleases(filters);
  }

  @Get('board')
  @RequirePermission('release:view')
  async board(
    @Query('product_id') productId?: string,
    @Query('user_id') userId?: string,
    @Query('search') search?: string,
  ) {
    const filters = {
      productId: productId ? Number(productId) : undefined,
      userId: userId ? Number(userId) : undefined,
      search: search || undefined,
    };
    return this.releasesService.getReleasesForBoard(filters);
  }

  @Put('reorder')
  @RequirePermission('release:edit')
  async reorder(@Body() body: { items: Array<{ id: number; sort_order: number; status?: string }>; userId?: number }) {
    if (!body.items || !Array.isArray(body.items)) {
      throw new BadRequestException('items array is required');
    }
    const validStatuses = [
      "Created", "Release In Progress", "PO Review provided",
      "Released to Dev", "Approved to Release to Production", "Released to Production",
    ];
    for (const item of body.items) {
      if (item.status && !validStatuses.includes(item.status)) {
        throw new BadRequestException(`Invalid status: ${item.status}`);
      }
    }
    return this.releasesService.reorderReleases(body.items, body.userId);
  }

  @Get(':id')
  @RequirePermission('release:view')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const release = await this.releasesService.getReleaseById(id);
    if (!release) throw new NotFoundException('Release not found');
    return { release };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('release:create')
  async create(@Body() body: any) {
    const parsed = schema.insertReleaseSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i: any) => i.message).join(', '));
    }
    const release = await this.releasesService.createRelease(parsed.data);
    return { release };
  }

  @Put(':id')
  @RequirePermission('release:edit')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const parsed = schema.insertReleaseSchema.partial().safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i: any) => i.message).join(', '));
    }
    const release = await this.releasesService.updateRelease(id, parsed.data);
    if (!release) throw new NotFoundException('Release not found');
    return { release };
  }

  @Delete(':id')
  @RequirePermission('release:delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.releasesService.deleteRelease(id);
    return { message: 'Release deleted' };
  }
}
