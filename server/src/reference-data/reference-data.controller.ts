import { Controller, Get } from '@nestjs/common';
import { ReferenceDataService } from './reference-data.service';

@Controller()
export class ReferenceDataController {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  @Get('products')
  async getProducts() {
    return this.referenceDataService.getProducts();
  }

  @Get('users')
  async getUsers() {
    return this.referenceDataService.getUsers();
  }

  @Get('work-orders')
  async getWorkOrders() {
    return this.referenceDataService.getWorkOrders();
  }
}
