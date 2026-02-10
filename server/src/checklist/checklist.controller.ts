import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { RequirePermission } from '../guards/permission.guard';

@Controller()
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Put('releases/update-checklist-item-state')
  @RequirePermission('release:edit')
  async updateItemState(@Body() body: any) {
    const { id, done } = body;
    if (typeof id !== 'number' || typeof done !== 'boolean') {
      throw new BadRequestException('Invalid request body. Requires id (number) and done (boolean).');
    }
    const item = await this.checklistService.updateChecklistItemState(id, done);
    if (!item) throw new NotFoundException('Checklist item not found');
    return { item };
  }

  @Get('checklist-templates')
  @RequirePermission('template:view')
  async findAll() {
    return this.checklistService.getTemplates();
  }

  @Get('checklist-templates/:id')
  @RequirePermission('template:view')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const template = await this.checklistService.getTemplateById(id);
    if (!template) throw new NotFoundException('Template not found');
    return { template };
  }

  @Post('checklist-templates')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('template:create')
  async create(@Body() body: any) {
    const template = await this.checklistService.createTemplate(body.name);
    return { template };
  }

  @Put('checklist-templates/:id')
  @RequirePermission('template:edit')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    if (body.items) {
      const template = await this.checklistService.replaceTemplateItems(id, body.items);
      if (!template) throw new NotFoundException('Template not found');
      return { template };
    }
    if (body.name) {
      const template = await this.checklistService.updateTemplate(id, body.name);
      if (!template) throw new NotFoundException('Template not found');
      return { template };
    }
    throw new BadRequestException('No valid update data provided');
  }

  @Delete('checklist-templates/:id')
  @RequirePermission('template:delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.checklistService.deleteTemplate(id);
    return { message: 'Template deleted' };
  }
}
