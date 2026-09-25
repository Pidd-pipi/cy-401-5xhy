import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  findAll() {
    return this.contractService.findAll();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: Request & { user: { sub: string } }) {
    return this.contractService.findMine(req.user.sub);
  }

  @Get('requirement/:requirementId')
  findByRequirement(@Param('requirementId') requirementId: string) {
    return this.contractService.findByRequirement(requirementId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: Request & { user: { sub: string } }, @Body() dto: CreateContractDto) {
    return this.contractService.create(req.user.sub, dto);
  }

  @Patch(':id/sign')
  @UseGuards(JwtAuthGuard)
  sign(@Param('id') id: string, @Req() req: Request & { user: { sub: string } }) {
    return this.contractService.sign(id, req.user.sub);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  complete(@Param('id') id: string, @Req() req: Request & { user: { sub: string } }) {
    return this.contractService.complete(id, req.user.sub);
  }

  @Patch(':id/terminate')
  @UseGuards(JwtAuthGuard)
  terminate(@Param('id') id: string, @Req() req: Request & { user: { sub: string } }) {
    return this.contractService.terminate(id, req.user.sub);
  }
}
