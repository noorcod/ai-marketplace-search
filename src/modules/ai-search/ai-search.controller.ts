import { Controller, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiSearchService } from './ai-search.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('AI Search')
@Controller('ai-search')
export class AiSearchController {
  constructor(private readonly aiSearchService: AiSearchService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI assistant for product search' })
  @ApiResponse({ status: 200, description: 'Chat response with products', type: ChatResponseDto })
  async chat(@Body() chatRequest: ChatRequestDto, @Query('sessionId') sessionId?: string): Promise<ChatResponseDto> {
    // Generate session ID if not provided
    const activeSessionId = sessionId || uuidv4();
    console.log('function');
    const result = await this.aiSearchService.chat(chatRequest.message, activeSessionId);

    return result;
  }
}
