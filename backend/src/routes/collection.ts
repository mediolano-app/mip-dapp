import { FastifyInstance } from 'fastify';
import { db } from 'lib/db.api';
import { assets, collections, INDEXER_SOURCES } from 'lib/schema';
import { eq, and, desc, asc, like, count } from 'drizzle-orm';

interface GetCollectionsByCreatorParams {
  creator: string;
}

interface GetCollectionsByCreatorQuery {
  indexerSource?: keyof typeof INDEXER_SOURCES;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAtBlock' | 'id';
  sortOrder?: 'asc' | 'desc';
}

interface GetCollectionByIdParams {
  id: string;
}

interface GetCollectionsQuery {
  indexerSource?: keyof typeof INDEXER_SOURCES;
  creator?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAtBlock' | 'id';
  sortOrder?: 'asc' | 'desc';
}

export async function collectionsRoutes(fastify: FastifyInstance) {
  
  // Get collections by creator
  fastify.get<{
    Params: GetCollectionsByCreatorParams;
    Querystring: GetCollectionsByCreatorQuery;
  }>('/collections/creator/:creator', {
    schema: {
      params: {
        type: 'object',
        required: ['creator'],
        properties: {
          creator: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          indexerSource: { 
            type: 'string', 
            enum: Object.keys(INDEXER_SOURCES) 
          },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['createdAtBlock', 'id'], default: 'createdAtBlock' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { creator } = request.params;
      const { 
        indexerSource, 
        limit = 20, 
        offset = 0, 
        sortBy = 'createdAtBlock', 
        sortOrder = 'desc' 
      } = request.query;

      const conditions = [eq(collections.creator, creator)];
      
      if (indexerSource) {
        conditions.push(eq(collections.indexerSource, INDEXER_SOURCES[indexerSource]));
      }

      const orderBy = sortOrder === 'desc' 
        ? desc(collections[sortBy]) 
        : asc(collections[sortBy]);

      const [userCollections, totalCount] = await Promise.all([
        db
          .select()
          .from(collections)
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        
        db
          .select({ count: count() })
          .from(collections)
          .where(and(...conditions))
          .then(result => result[0].count)
      ]);

      // Enrich collections with asset counts
      const enrichedCollections = await Promise.all(
        userCollections.map(async (collection) => {
          const assetCountResult = await db
            .select({ count: count() })
            .from(assets)
            .where(eq(assets.collectionId, collection.id));
          
          return {
            ...collection,
            assetCount: assetCountResult[0].count
          };
        })
      );

      reply.send({
        data: enrichedCollections,
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

  // Get single collection by ID
  fastify.get<{
    Params: GetCollectionByIdParams;
  }>('/collections/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const [collection, assetCount, recentAssets] = await Promise.all([
        db
          .select()
          .from(collections)
          .where(eq(collections.id, id))
          .limit(1),
        
        db
          .select({ count: count() })
          .from(assets)
          .where(eq(assets.collectionId, id))
          .then(result => result[0].count),

        db
          .select()
          .from(assets)
          .where(eq(assets.collectionId, id))
          .orderBy(desc(assets.mintedAtBlock))
          .limit(5)
      ]);

      if (collection.length === 0) {
        reply.status(404).send({ error: 'Collection not found' });
        return;
      }

      reply.send({ 
        data: {
          ...collection[0],
          assetCount,
          recentAssets
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get all collections with filtering
  fastify.get<{
    Querystring: GetCollectionsQuery;
  }>('/collections', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          indexerSource: { 
            type: 'string', 
            enum: Object.keys(INDEXER_SOURCES) 
          },
          creator: { type: 'string' },
          search: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['createdAtBlock', 'id'], default: 'createdAtBlock' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { 
        indexerSource, 
        creator,
        search,
        limit = 20, 
        offset = 0, 
        sortBy = 'createdAtBlock', 
        sortOrder = 'desc' 
      } = request.query;

      const conditions = [];
      
      if (indexerSource) {
        conditions.push(eq(collections.indexerSource, INDEXER_SOURCES[indexerSource]));
      }
      
      if (creator) {
        conditions.push(eq(collections.creator, creator));
      }

      if (search) {
        conditions.push(like(collections.id, `%${search}%`));
      }

      const orderBy = sortOrder === 'desc' 
        ? desc(collections[sortBy]) 
        : asc(collections[sortBy]);

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [allCollections, totalCount] = await Promise.all([
        db
          .select()
          .from(collections)
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        
        db
          .select({ count: count() })
          .from(collections)
          .where(whereClause)
          .then(result => result[0].count)
      ]);

      // Enrich with asset counts
      const enrichedCollections = await Promise.all(
        allCollections.map(async (collection) => {
          const assetCountResult = await db
            .select({ count: count() })
            .from(assets)
            .where(eq(assets.collectionId, collection.id));
          
          return {
            ...collection,
            assetCount: assetCountResult[0].count
          };
        })
      );

      reply.send({
        data: enrichedCollections,
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