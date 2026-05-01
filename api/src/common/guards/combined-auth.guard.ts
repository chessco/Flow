import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from './api-key.guard';
import { firstValueFrom, isObservable } from 'rxjs';

@Injectable()
export class CombinedAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(CombinedAuthGuard.name);

  constructor(
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    
    // 1. Try API Key authentication first (for bridge/internal calls)
    try {
      const isApiKeyValid = await this.apiKeyGuard.canActivate(context);
      if (isApiKeyValid) {
        this.logger.debug(`Authenticated via API Key for ${url}`);
        return true;
      }
    } catch (error) {
      this.logger.error(`API Key validation error: ${error.message}`);
    }

    // 2. Try JWT authentication (standard user session)
    try {
      const result = await super.canActivate(context);
      
      if (result) {
        this.logger.debug(`Authenticated via JWT for ${url}. User: ${request.user ? request.user.email : 'system'}`);
        return true;
      }
      
      return false;
    } catch (error) {
      const authHeader = request.headers['authorization'];
      this.logger.warn(`JWT validation failed for ${url}: ${error.message}. Auth Header: ${authHeader ? 'Present' : 'Missing'}`);
      throw error;
    }
  }
}
