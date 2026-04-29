import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  private jwtGuard: CanActivate;

  constructor(
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {
    // Create an instance of the JWT AuthGuard
    const JwtGuardClass = AuthGuard('jwt');
    this.jwtGuard = new JwtGuardClass();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Try API Key authentication first
    try {
      const isApiKeyValid = await this.apiKeyGuard.canActivate(context);
      if (isApiKeyValid) {
        return true;
      }
    } catch (error) {
      // Ignore API key errors and try JWT
    }

    // 2. Try JWT authentication
    try {
      const result = await (this.jwtGuard as any).canActivate(context);
      if (typeof result === 'boolean') {
        return result;
      }
      // If it's an observable or promise, we'd need more complex handling, 
      // but Nest's AuthGuard typically returns boolean or Promise<boolean>
      return !!result;
    } catch (error) {
      return false;
    }
  }
}
