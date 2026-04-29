import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from './api-key.guard';
import { firstValueFrom, isObservable } from 'rxjs';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  private readonly logger = new Logger(CombinedAuthGuard.name);
  private jwtGuard: CanActivate;

  constructor(
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {
    // Create an instance of the JWT AuthGuard
    const JwtGuardClass = AuthGuard('jwt');
    this.jwtGuard = new JwtGuardClass();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    
    // 1. Try API Key authentication first
    try {
      const isApiKeyValid = await this.apiKeyGuard.canActivate(context);
      if (isApiKeyValid) {
        this.logger.debug(`Authenticated via API Key for ${url}`);
        return true;
      }
    } catch (error) {
      this.logger.error(`API Key validation error: ${error.message}`);
    }

    // 2. Try JWT authentication
    try {
      const result = this.jwtGuard.canActivate(context);
      
      let canActivateJwt: boolean;
      if (typeof result === 'boolean') {
        canActivateJwt = result;
      } else if (isObservable(result)) {
        canActivateJwt = await firstValueFrom(result);
      } else {
        canActivateJwt = await result;
      }

      if (!canActivateJwt) {
        this.logger.warn(`JWT validation failed for ${url} (returned false)`);
        throw new UnauthorizedException('Authentication failed');
      }

      this.logger.debug(`Authenticated via JWT for ${url}. User: ${request.user ? request.user.email : 'MISSING'}`);
      return true;
    } catch (error) {
      const authHeader = request.headers['authorization'];
      this.logger.warn(`JWT validation failed for ${url}: ${error.message}. Auth Header: ${authHeader ? 'Present' : 'Missing'}`);
      throw error;
    }
  }
}
