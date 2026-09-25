import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RequirementStatus } from '../../common/enums/requirement-status.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { RequirementService } from './requirement.service';

@Controller('requirements')
export class RequirementController {
  constructor(private readonly requirementService: RequirementService) {}

  @Get()
  findAll(
    @Query('keyword') keyword?: string,
    @Query('status') status?: RequirementStatus,
    @Query('skill') skill?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string
  ) {
    return this.requirementService.findAll({
      keyword,
      status,
      skill,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined
    });
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: Request & { user: { sub: string } }) {
    return this.requirementService.findMine(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requirementService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: Request & { user: { sub: string } }, @Body() dto: CreateRequirementDto) {
    return this.requirementService.create(req.user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateRequirementDto) {
    return this.requirementService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  changeStatus(@Param('id') id: string, @Body('status') status: RequirementStatus) {
    return this.requirementService.changeStatus(id, status);
  }
}
