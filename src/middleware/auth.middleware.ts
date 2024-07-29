import type { FastifyRequest, FastifyReply } from 'fastify';
import redis from '../redis';
import { MappingTenant } from '../config/mapping-tenant';

declare module 'fastify' {
  interface FastifyRequest {
    accessToken?: string;
    tenantId?: string;
    ammanDbName?: string;
  }
}

export const withPermitMiddleware = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const accessToken = req.headers['x-access-token'];
  try {
    const tokenExists = await redis.exists(accessToken as string);
    if (!tokenExists) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
  } catch (err) {
    reply.status(500).send({ error: 'Internal Server Error' });
    return;
  }
  req.accessToken = accessToken as string;

  const tenantIdHeader = req.headers['x-tenant-id'];
  if (!tenantIdHeader) {
    reply.status(400).send({ error: 'Missing headers or query parameters' });
    return;
  }

  let tenantId = (tenantIdHeader as string).split('.')[0] as string;

  const isLocalhost =
    req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (tenantId === 'testing' || isLocalhost) {
    tenantId = 'cloud_hospital';
  }

  if (!Object.prototype.hasOwnProperty.call(MappingTenant, tenantId)) {
    reply.status(400).send({ error: 'Tenant ID invalid' });
    return;
  }

  req.tenantId = tenantId;
  req.ammanDbName = MappingTenant[tenantId];
};
