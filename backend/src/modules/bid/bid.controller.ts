import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BidService } from './bid.service';
import { CreateBidDto } from './dto/create-bid.dto';

@Controller('bids')
export class BidController {
  constructor(private readonly bidService: BidService) {}

  @Get()
  findAll() {
    return this.bidService.findAll();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: Request & { user: { sub: string } }) {
    return this.bidService.findMine(req.user.sub);
  }

  @Get('requirement/:requirementId')
  findByRequirement(@Param('requirementId') requirementId: string) {
    return this.bidService.findByRequirement(requirementId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  submit(@Req() req: Request & { user: { sub: string } }, @Body() dto: CreateBidDto) {
    return this.bidService.submit(req.user.sub, dto);
  }

  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard)
  accept(@Param('id') id: string) {
    return this.bidService.accept(id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject(@Param('id') id: string) {
    return this.bidService.reject(id);
  }

  @Patch(':id/withdraw')
  @UseGuards(JwtAuthGuard)
  withdraw(@Param('id') id: string, @Req() req: Request & { user: { sub: string } }) {
    return this.bidService.withdraw(id, req.user.sub);
  }

  @Post(':id/attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return {
      bidId: id,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  }
}
