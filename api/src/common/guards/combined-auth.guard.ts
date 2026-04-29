import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: AuthGuard('jwt'),
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try API Key first
    const isApiKeyValid = await this.apiKeyGuard.canActivate(context);
    if (isApiKeyValid) return true;

    // Try JWT next
    try {
      const isJwtValid = await (this.jwtAuthGuard as any).canActivate(context);
      return !!isJwtValid;
    } catch (e) {
      return false;
    }
  }
}
