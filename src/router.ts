import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { EmployeeType } from './services/model';
import {
  type SearchPatientType,
  SearchPatientService,
} from './services/search-pasien';
import { SyncPatientService } from './services/sync-pasien';

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/pasien', async (req: FastifyRequest, reply: FastifyReply) => {
    const { name, nik, next, limit } = req.query as {
      name?: string;
      nik?: string;
      next?: string;
      limit?: string;
    };

    if (limit && Number.isNaN(Number(limit))) {
      return reply.status(400).send({ error: 'Params limit must be a number' });
    }

    if (next && Number.isNaN(Number(next))) {
      return reply.status(400).send({ error: 'Params next must be a number' });
    }

    if (!name && !nik) {
      return reply.status(400).send({
        error: 'At least one search parameter (name or nik) is required',
      });
    }

    try {
      const payload: SearchPatientType = {
        limit: Number(limit),
        next: Number(next),
        nik: nik || '',
        name: name || '',
      };
      const response = await SearchPatientService(
        payload,
        req.ammanDbName || '',
      );
      reply.send(response);
    } catch (err) {
      req.log.error(err);
      reply.status(500).send({ error: 'Database query failed' });
    }
  });

  fastify.post<{ Body: EmployeeType }>(
    '/sync-pasien',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as EmployeeType;
      const tenantId = req.tenantId;
      try {
        const insertedId = await SyncPatientService(body, tenantId || '');
        return reply.send({ id: insertedId });
      } catch (err) {
        console.error('Database error:', err);
        return reply.status(500).send({ error: 'Database error' });
      }
    },
  );
}
