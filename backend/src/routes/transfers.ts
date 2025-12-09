import { FastifyInstance} from 'fastify';
import { db } from 'lib/db.api';
import { assets, transfers, INDEXER_SOURCES } from 'lib/schema';
import { eq, and, desc, asc, count } from 'drizzle-orm';

interface GetTransfersByTokenParams {
  tokenId: string;
}

interface GetTransfersByTokenQuery {
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
}

interface GetTransfersQuery {
  tokenId?: string;
  from?: string;
  to?: string;
  indexerSource?: keyof typeof INDEXER_SOURCES;
  limit?: number;
  offset?: number;
  sortBy?: 'block' | 'id';
  sortOrder?: 'asc' | 'desc';
}

export async function transfersRoutes(fastify: FastifyInstance) {
  
  // Get transfers by token ID
  fastify.get<{
    Params: GetTransfersByTokenParams;
    Querystring: GetTransfersByTokenQuery;
  }>('/transfers/token/:tokenId', {
    schema: {
      params: {
        type: 'object',
        required: ['tokenId'],
        properties: {
          tokenId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { tokenId } = request.params;
      const { limit = 20, offset = 0, sortOrder = 'desc' } = request.query;

      const orderBy = sortOrder === 'desc' ? desc(transfers.block) : asc(transfers.block);

      const [tokenTransfers, totalCount] = await Promise.all([
        db
          .select({
            id: transfers.id,
            tokenId: transfers.tokenId,
            from: transfers.from,
            to: transfers.to,
            block: transfers.block,
            indexerSource: transfers.indexerSource,
            asset: {
              id: assets.id,
              collectionId: assets.collectionId,
              tokenUri: assets.tokenUri,
              owner: assets.owner
            }
          })
          .from(transfers)
          .leftJoin(assets, eq(transfers.tokenId, assets.id))
          .where(eq(transfers.tokenId, tokenId))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        
        db
          .select({ count: count() })
          .from(transfers)
          .where(eq(transfers.tokenId, tokenId))
          .then(result => result[0].count)
      ]);

      reply.send({
        data: tokenTransfers,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get transfers by address (from)
  fastify.get<{
    Params: { from: string };
    Querystring: GetTransfersByTokenQuery;
  }>('/transfers/from/:from', {
    schema: {
      params: {
        type: 'object',
        required: ['from'],
        properties: {
          from: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { from } = request.params;
      const { limit = 20, offset = 0, sortOrder = 'desc' } = request.query;

      const orderBy = sortOrder === 'desc' ? desc(transfers.block) : asc(transfers.block);

      const [fromTransfers, totalCount] = await Promise.all([
        db
          .select({
            id: transfers.id,
            tokenId: transfers.tokenId,
            from: transfers.from,
            to: transfers.to,
            block: transfers.block,
            indexerSource: transfers.indexerSource,
            asset: {
              id: assets.id,
              collectionId: assets.collectionId,
              tokenUri: assets.tokenUri,
              owner: assets.owner
            }
          })
          .from(transfers)
          .leftJoin(assets, eq(transfers.tokenId, assets.id))
          .where(eq(transfers.from, from))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        
        db
          .select({ count: count() })
          .from(transfers)
          .where(eq(transfers.from, from))
          .then(result => result[0].count)
      ]);

      reply.send({
        data: fromTransfers,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get transfers by address (to)
  fastify.get<{
    Params: { to: string };
    Querystring: GetTransfersByTokenQuery;
  }>('/transfers/to/:to', {
    schema: {
      params: {
        type: 'object',
        required: ['to'],
        properties: {
          to: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { to } = request.params;
      const { limit = 20, offset = 0, sortOrder = 'desc' } = request.query;

      const orderBy = sortOrder === 'desc' ? desc(transfers.block) : asc(transfers.block);

      const [toTransfers, totalCount] = await Promise.all([
        db
          .select({
            id: transfers.id,
            tokenId: transfers.tokenId,
            from: transfers.from,
            to: transfers.to,
            block: transfers.block,
            indexerSource: transfers.indexerSource,
            asset: {
              id: assets.id,
              collectionId: assets.collectionId,
              tokenUri: assets.tokenUri,
              owner: assets.owner
            }
          })
          .from(transfers)
          .leftJoin(assets, eq(transfers.tokenId, assets.id))
          .where(eq(transfers.to, to))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        
        db
          .select({ count: count() })
          .from(transfers)
          .where(eq(transfers.to, to))
          .then(result => result[0].count)
      ]);

      reply.send({
        data: toTransfers,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get all transfers with filtering
  fastify.get<{
    Querystring: GetTransfersQuery;
  }>('/transfers', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          tokenId: { type: 'string' },
          from: { type: 'string' },
          to: { type: 'string' },
          indexerSource: { 
            type: 'string', 
            enum: Object.keys(INDEXER_SOURCES) 
          },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['block', 'id'], default: 'block' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { 
        tokenId,
        from,
        to,
        indexerSource, 
        limit = 20, 
        offset = 0, 
        sortBy = 'block', 
        sortOrder = 'desc' 
      } = request.query;

      const conditions = [];
      
      if (tokenId) {
        conditions.push(eq(transfers.tokenId, tokenId));
      }
      
      if (from) {
        conditions.push(eq(transfers.from, from));
      }

      if (to) {
        conditions.push(eq(transfers.to, to));
      }

      if (indexerSource) {
        conditions.push(eq(transfers.indexerSource, INDEXER_SOURCES[indexerSource]));
      }

      const orderBy = sortOrder === 'desc' 
        ? desc(transfers[sortBy]) 
        : asc(transfers[sortBy]);

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [allTransfers, totalCount] = await Promise.all([
        db
          .select({
            id: transfers.id,
            tokenId: transfers.tokenId,
            from: transfers.from,
            to: transfers.to,
            block: transfers.block,
            indexerSource: transfers.indexerSource,
            asset: {
              id: assets.id,
              collectionId: assets.collectionId,
              tokenUri: assets.tokenUri,
              owner: assets.owner
            }
          })
          .from(transfers)
          .leftJoin(assets, eq(transfers.tokenId, assets.id))
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        
        db
          .select({ count: count() })
          .from(transfers)
          .where(whereClause)
          .then(result => result[0].count)
      ]);

      reply.send({
        data: allTransfers,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
}