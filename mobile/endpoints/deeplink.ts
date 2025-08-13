import { apiConfig } from '~/endpoints/api-config';

export function deeplink(target: string) {
  return `${apiConfig.backendUrl}/_open/${target}`;
}
