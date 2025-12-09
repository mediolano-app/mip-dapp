import { FastifyInstance, FastifyRequest} from 'fastify';

import { assets, collections,INDEXER_SOURCES } from 'lib/schema';
import { eq, and, desc, asc, like, count } from 'drizzle-orm';
import { db } from 'lib/db.api';

interface GetAssetsByOwnerParams {
  owner: string;
}

interface GetAssetsByOwnerQuery {
  indexerSource?: keyof typeof INDEXER_SOURCES;
  collectionId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'mintedAtBlock' | 'id';
  sortOrder?: 'asc' | 'desc';
}

export async function assetsRoutes(fastify: FastifyInstance) {
  // Get assets by owner
  fastify.get<{
    Params: GetAssetsByOwnerParams;
    Querystring: GetAssetsByOwnerQuery;
  }>('/assets/owner/:owner', async (request, reply) => {
    try {
      const { owner } = request.params;
      const { 
        indexerSource, 
        collectionId, 
        limit = 20, 
        offset = 0, 
        sortBy = 'mintedAtBlock', 
        sortOrder = 'desc' 
      } = request.query;

      const conditions = [eq(assets.owner, owner)];
      
      if (indexerSource) {
        conditions.push(eq(assets.indexerSource, INDEXER_SOURCES[indexerSource]));
      }
      
      if (collectionId) {
        conditions.push(eq(assets.collectionId, collectionId));
      }

      const orderBy = sortOrder === 'desc' 
        ? desc(assets[sortBy]) 
        : asc(assets[sortBy]);

      const [userAssets, totalCount] = await Promise.all([
        db
          .select({
            id: assets.id,
            collectionId: assets.collectionId,
            owner: assets.owner,
            tokenUri: assets.tokenUri,
            mintedAtBlock: assets.mintedAtBlock,
            indexerSource: assets.indexerSource,
            collection: {
              id: collections.id,
              creator: collections.creator,
              metadataUri: collections.metadataUri,
              createdAtBlock: collections.createdAtBlock,
              indexerSource: collections.indexerSource
            }
          })
          .from(assets)
          .leftJoin(collections, eq(assets.collectionId, collections.id))
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        
        db
          .select({ count: count() })
          .from(assets)
          .where(and(...conditions))
          .then(result => result[0].count)
      ]);

      reply.send({
        data: userAssets,
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

  // Get single asset by ID
  fastify.get<{ Params: { id: string } }>('/assets/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const asset = await db
        .select({
          id: assets.id,
          collectionId: assets.collectionId,
          owner: assets.owner,
          tokenUri: assets.tokenUri,
          mintedAtBlock: assets.mintedAtBlock,
          indexerSource: assets.indexerSource,
          collection: {
            id: collections.id,
            creator: collections.creator,
            metadataUri: collections.metadataUri,
            createdAtBlock: collections.createdAtBlock,
            indexerSource: collections.indexerSource
          }
        })
        .from(assets)
        .leftJoin(collections, eq(assets.collectionId, collections.id))
        .where(eq(assets.id, id))
        .limit(1);

      if (asset.length === 0) {
        reply.status(404).send({ error: 'Asset not found' });
        return;
      }

      reply.send({ data: asset[0] });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get all assets with filtering
  fastify.get('/assets', async (request: FastifyRequest<{
    Querystring: {
      indexerSource?: keyof typeof INDEXER_SOURCES;
      collectionId?: string;
      search?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'mintedAtBlock' | 'id';
      sortOrder?: 'asc' | 'desc';
    };
  }>, reply) => {
    try {
      const { 
        indexerSource, 
        collectionId, 
        search,
        limit = 20, 
        offset = 0, 
        sortBy = 'mintedAtBlock', 
        sortOrder = 'desc' 
      } = request.query;

      const conditions = [];
      
      if (indexerSource) {
        conditions.push(eq(assets.indexerSource, INDEXER_SOURCES[indexerSource]));
      }
      
      if (collectionId) {
        conditions.push(eq(assets.collectionId, collectionId));
      }

      if (search) {
        conditions.push(like(assets.id, `%${search}%`));
      }

      const orderBy = sortOrder === 'desc' 
        ? desc(assets[sortBy]) 
        : asc(assets[sortBy]);

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [allAssets, totalCount] = await Promise.all([
        db
          .select({
            id: assets.id,
            collectionId: assets.collectionId,
            owner: assets.owner,
            tokenUri: assets.tokenUri,
            mintedAtBlock: assets.mintedAtBlock,
            indexerSource: assets.indexerSource,
            collection: {
              id: collections.id,
              creator: collections.creator,
              metadataUri: collections.metadataUri,
              createdAtBlock: collections.createdAtBlock,
              indexerSource: collections.indexerSource
            }
          })
          .from(assets)
          .leftJoin(collections, eq(assets.collectionId, collections.id))
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        
        db
          .select({ count: count() })
          .from(assets)
          .where(whereClause)
          .then(result => result[0].count)
      ]);

      reply.send({
        data: allAssets,
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