import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from 'lib/db.api';
import { assets, collections, transfers, INDEXER_SOURCES } from 'lib/schema';
import { eq, desc, count, sql } from 'drizzle-orm';

export async function statsRoutes(fastify: FastifyInstance) {
  
  // Get overall stats
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [
        totalAssets,
        totalCollections,
        totalTransfers,
        assetsByIndexer,
        collectionsByIndexer,
        recentActivity
      ] = await Promise.all([
        // Total assets count
        db.select({ count: count() }).from(assets).then(result => result[0].count),
        
        // Total collections count
        db.select({ count: count() }).from(collections).then(result => result[0].count),
        
        // Total transfers count
        db.select({ count: count() }).from(transfers).then(result => result[0].count),
        
        // Assets by indexer source
        db
          .select({
            indexerSource: assets.indexerSource,
            count: count()
          })
          .from(assets)
          .groupBy(assets.indexerSource),
        
        // Collections by indexer source
        db
          .select({
            indexerSource: collections.indexerSource,
            count: count()
          })
          .from(collections)
          .groupBy(collections.indexerSource),
        
        // Recent transfer activity
        db
          .select({
            id: transfers.id,
            tokenId: transfers.tokenId,
            from: transfers.from,
            to: transfers.to,
            block: transfers.block,
            indexerSource: transfers.indexerSource
          })
          .from(transfers)
          .orderBy(desc(transfers.block))
          .limit(10)
      ]);

      reply.send({
        data: {
          totalAssets,
          totalCollections,
          totalTransfers,
          assetsByIndexer,
          collectionsByIndexer,
          recentActivity
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get stats by indexer source
  fastify.get<{
    Querystring: { indexerSource?: keyof typeof INDEXER_SOURCES };
  }>('/stats/indexer', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          indexerSource: { 
            type: 'string', 
            enum: Object.keys(INDEXER_SOURCES),
            description: 'Filter stats by specific indexer source'
          }
        },
        required: ['indexerSource']
      }
    }
  }, async (request, reply) => {
    try {
      const { indexerSource } = request.query;

      if (!indexerSource) {
        reply.status(400).send({ error: 'indexerSource query parameter is required' });
        return;
      }

      const indexerSourceValue = INDEXER_SOURCES[indexerSource];

      const [
        totalAssets,
        totalCollections,
        totalTransfers,
        topCollections,
        topOwners,
        recentMints
      ] = await Promise.all([
        // Total assets for this indexer
        db
          .select({ count: count() })
          .from(assets)
          .where(eq(assets.indexerSource, indexerSourceValue))
          .then(result => result[0].count),
        
        // Total collections for this indexer
        db
          .select({ count: count() })
          .from(collections)
          .where(eq(collections.indexerSource, indexerSourceValue))
          .then(result => result[0].count),
        
        // Total transfers for this indexer
        db
          .select({ count: count() })
          .from(transfers)
          .where(eq(transfers.indexerSource, indexerSourceValue))
          .then(result => result[0].count),
        
        // Top collections by asset count
        db
          .select({
            collectionId: assets.collectionId,
            assetCount: count(),
            collection: {
              id: collections.id,
              creator: collections.creator,
              metadataUri: collections.metadataUri,
              createdAtBlock: collections.createdAtBlock
            }
          })
          .from(assets)
          .leftJoin(collections, eq(assets.collectionId, collections.id))
          .where(eq(assets.indexerSource, indexerSourceValue))
          .groupBy(
            assets.collectionId, 
            collections.id, 
            collections.creator, 
            collections.metadataUri, 
            collections.createdAtBlock
          )
          .orderBy(desc(count()))
          .limit(5),
        
        // Top owners by asset count
        db
          .select({
            owner: assets.owner,
            assetCount: count()
          })
          .from(assets)
          .where(eq(assets.indexerSource, indexerSourceValue))
          .groupBy(assets.owner)
          .orderBy(desc(count()))
          .limit(10),
        
        // Recent mints (newly created assets)
        db
          .select({
            id: assets.id,
            collectionId: assets.collectionId,
            owner: assets.owner,
            tokenUri: assets.tokenUri,
            mintedAtBlock: assets.mintedAtBlock
          })
          .from(assets)
          .where(eq(assets.indexerSource, indexerSourceValue))
          .orderBy(desc(assets.mintedAtBlock))
          .limit(10)
      ]);

      reply.send({
        data: {
          indexerSource,
          totalAssets,
          totalCollections,
          totalTransfers,
          topCollections,
          topOwners,
          recentMints
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get collection stats (assets count, recent activity)
  fastify.get<{
    Params: { collectionId: string };
  }>('/stats/collection/:collectionId', {
    schema: {
      params: {
        type: 'object',
        required: ['collectionId'],
        properties: {
          collectionId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { collectionId } = request.params;

      const [
        collection,
        totalAssets,
        uniqueOwners,
        recentTransfers,
        recentMints
      ] = await Promise.all([
        // Collection details
        db
          .select()
          .from(collections)
          .where(eq(collections.id, collectionId))
          .limit(1),
        
        // Total assets in collection
        db
          .select({ count: count() })
          .from(assets)
          .where(eq(assets.collectionId, collectionId))
          .then(result => result[0].count),
        
        // Unique owners count
        db
          .select({ count: sql<number>`count(distinct ${assets.owner})` })
          .from(assets)
          .where(eq(assets.collectionId, collectionId))
          .then(result => result[0].count),
        
        // Recent transfers for this collection
        db
          .select({
            id: transfers.id,
            tokenId: transfers.tokenId,
            from: transfers.from,
            to: transfers.to,
            block: transfers.block
          })
          .from(transfers)
          .leftJoin(assets, eq(transfers.tokenId, assets.id))
          .where(eq(assets.collectionId, collectionId))
          .orderBy(desc(transfers.block))
          .limit(10),
        
        // Recent mints in this collection
        db
          .select()
          .from(assets)
          .where(eq(assets.collectionId, collectionId))
          .orderBy(desc(assets.mintedAtBlock))
          .limit(10)
      ]);

      if (collection.length === 0) {
        reply.status(404).send({ error: 'Collection not found' });
        return;
      }

      reply.send({
        data: {
          collection: collection[0],
          totalAssets,
          uniqueOwners,
          recentTransfers,
          recentMints
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get owner stats (total assets, collections owned, recent activity)
  fastify.get<{
    Params: { owner: string };
  }>('/stats/owner/:owner', {
    schema: {
      params: {
        type: 'object',
        required: ['owner'],
        properties: {
          owner: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { owner } = request.params;

      const [
        totalAssets,
        collectionsOwned,
        recentAcquisitions,
        recentSales,
        assetsByIndexer
      ] = await Promise.all([
        // Total assets owned
        db
          .select({ count: count() })
          .from(assets)
          .where(eq(assets.owner, owner))
          .then(result => result[0].count),
        
        // Collections this owner has assets in
        db
          .select({
            collectionId: assets.collectionId,
            assetCount: count(),
            collection: {
              id: collections.id,
              creator: collections.creator,
              metadataUri: collections.metadataUri
            }
          })
          .from(assets)
          .leftJoin(collections, eq(assets.collectionId, collections.id))
          .where(eq(assets.owner, owner))
          .groupBy(
            assets.collectionId, 
            collections.id, 
            collections.creator, 
            collections.metadataUri
          )
          .orderBy(desc(count())),
        
        // Recent acquisitions (transfers TO this owner)
        db
          .select({
            id: transfers.id,
            tokenId: transfers.tokenId,
            from: transfers.from,
            to: transfers.to,
            block: transfers.block,
            asset: {
              id: assets.id,
              collectionId: assets.collectionId,
              tokenUri: assets.tokenUri
            }
          })
          .from(transfers)
          .leftJoin(assets, eq(transfers.tokenId, assets.id))
          .where(eq(transfers.to, owner))
          .orderBy(desc(transfers.block))
          .limit(10),
        
        // Recent sales (transfers FROM this owner)
        db
          .select({
            id: transfers.id,
            tokenId: transfers.tokenId,
            from: transfers.from,
            to: transfers.to,
            block: transfers.block,
            asset: {
              id: assets.id,
              collectionId: assets.collectionId,
              tokenUri: assets.tokenUri
            }
          })
          .from(transfers)
          .leftJoin(assets, eq(transfers.tokenId, assets.id))
          .where(eq(transfers.from, owner))
          .orderBy(desc(transfers.block))
          .limit(10),
        
        // Assets by indexer source
        db
          .select({
            indexerSource: assets.indexerSource,
            count: count()
          })
          .from(assets)
          .where(eq(assets.owner, owner))
          .groupBy(assets.indexerSource)
      ]);

      reply.send({
        data: {
          owner,
          totalAssets,
          collectionsOwned,
          recentAcquisitions,
          recentSales,
          assetsByIndexer
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get trending collections (most active in recent blocks)
  fastify.get('/stats/trending', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          blocks: { type: 'number', minimum: 1, default: 1000, description: 'Number of recent blocks to analyze' },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: { blocks?: number; limit?: number };
  }>, reply) => {
    try {
      const { blocks = 1000, limit = 10 } = request.query;

      // Get the latest block number
      const latestBlockResult = await db
        .select({ maxBlock: sql<number>`max(${transfers.block})` })
        .from(transfers);
      
      const latestBlock = latestBlockResult[0].maxBlock || 0;
      const fromBlock = Math.max(0, latestBlock - blocks);

      // Get trending collections by transfer activity
      const trendingCollections = await db
        .select({
          collectionId: assets.collectionId,
          transferCount: count(),
          collection: {
            id: collections.id,
            creator: collections.creator,
            metadataUri: collections.metadataUri,
            createdAtBlock: collections.createdAtBlock
          }
        })
        .from(transfers)
        .leftJoin(assets, eq(transfers.tokenId, assets.id))
        .leftJoin(collections, eq(assets.collectionId, collections.id))
        .where(sql`${transfers.block} >= ${fromBlock}`)
        .groupBy(
          assets.collectionId,
          collections.id,
          collections.creator,
          collections.metadataUri,
          collections.createdAtBlock
        )
        .orderBy(desc(count()))
        .limit(limit);

      reply.send({
        data: {
          fromBlock,
          toBlock: latestBlock,
          blocksAnalyzed: blocks,
          trendingCollections
        }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
}