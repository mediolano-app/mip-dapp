import { defineIndexer } from "apibara/indexer";
import { getSelector } from "@apibara/starknet";
import { useLogger } from "apibara/plugins";
import { StarknetStream } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";
import * as schema from "../lib/schema";
import { feltsToString, feltToAddress } from "../lib/util";
import { drizzleStorage } from "@apibara/plugin-drizzle";
import { db } from "../lib/db";
import { eq } from "drizzle-orm";
import { INDEXER_SOURCES } from "../lib/schema";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  const { streamUrl, startingBlock, contractAddress} = runtimeConfig["dappIndexer"];

  console.log(streamUrl,startingBlock, contractAddress,"whip")
  // Indexer Source
  const indexerSource = INDEXER_SOURCES["MEDIALANO-DAPP"]


  return defineIndexer(StarknetStream)({
    streamUrl,
    finality: "accepted",
    startingBlock: BigInt(startingBlock),

    filter: {
      events: [
        {
          address: contractAddress as `0x${string}`,
        },
      ],
    },

    // plugins: [
    //   drizzleStorage({ db, migrate: { migrationsFolder: "./drizzle" } }),
    // ],

    async transform({ block, endCursor, finality }) {
      const { events } = block;
      const logger = useLogger();

      logger.info(
        `📦 Transform | orderKey=${endCursor?.orderKey} | finality=${finality} | events=${events.length} | blockNumber=${block.header.blockNumber}`
      );

      if (events.length === 0) return;

      const factoryAddress = contractAddress.toLowerCase();

      for (const event of events) {
        const selector = event.keys[0];
        const eventAddress = event.address.toLowerCase();
        const data = event.data;

        const isFromFactory = eventAddress === factoryAddress;
        const eventSource = isFromFactory ? "factory" : "deployed_collection";

        logger.info("🔍 Transform processing event", {
          source: eventSource,
          address: event.address,
          selector,
          data,
          blockNumber: block.header.blockNumber,
        });

        switch (selector) {
          case getSelector("CollectionCreated"): {
            const collectionId = `${indexerSource}_${BigInt(data[0]).toString()}`;
            const creator = feltToAddress(data[2]);
            const metadataUri = feltsToString([data[10], data[11], data[12]]);

            await db
              .insert(schema.collections)
              // @ts-ignore
              .values({
                id: collectionId,
                creator,
                metadataUri,
                createdAtBlock: endCursor?.orderKey,
                indexerSource
              })
              .onConflictDoUpdate({
                target: schema.collections.id,
                set: {
                  creator,
                  metadataUri,
                  createdAtBlock: endCursor?.orderKey as any,
                },
              });

            break;
          }

          case getSelector("CollectionUpdated"): {
            const collectionId = `${indexerSource}_${BigInt(data[0]).toString()}`;
            const creator = feltToAddress(data[1]);
            const metadataUri = feltsToString([data[4]]); // assuming single felt string

            await db
              .insert(schema.collections)
              // @ts-ignore
              .values({
                id: collectionId,
                creator,
                metadataUri,
                createdAtBlock: endCursor?.orderKey,
                indexerSource
              })
              .onConflictDoUpdate({
                target: schema.collections.id,
                set: {
                  creator,
                  metadataUri,
                  createdAtBlock: endCursor?.orderKey as any,
                },
              });

            break;
          }

          case getSelector("TokenMinted"): {
            const collectionId = `${indexerSource}_${BigInt(data[0]).toString()}`;
            const metadataUri = feltsToString(data.slice(6, 9)); // decode ipfs://
            const tokenId = `${indexerSource}_${BigInt(data[2]).toString()}`;
            const owner = feltToAddress(data[4]);

            // Ensure collection exists (insert stub if missing)
            const collection = await db.query.collections.findFirst({
              where: eq(schema.collections.id, collectionId),
            });

            if (!collection) {
              await db
                .insert(schema.collections)
                // @ts-ignore
                .values({
                  id: collectionId,
                  indexerSource,
                  creator: feltToAddress(data[4]),
                  metadataUri: null,
                  createdAtBlock: endCursor?.orderKey,
                })
                .onConflictDoNothing();
            }

            // Upsert asset (insert or update if duplicate)
            await db
              .insert(schema.assets)
              // @ts-ignore
              .values({
                id: tokenId,
                collectionId,
                indexerSource,
                owner,
                tokenUri: metadataUri,
                mintedAtBlock: endCursor?.orderKey,
              })
              .onConflictDoUpdate({
                target: schema.assets.id,
                set: {
                  owner,
                  tokenUri: metadataUri,
                  mintedAtBlock: endCursor?.orderKey as any,
                },
              });

            break;
          }

          case getSelector("TokenMintedBatch"): {
            const collectionId = `${indexerSource}_${BigInt(data[0]).toString()}`;
            //@ts-ignore
            const tokenIds = data[1] as string[]; // array of felt
            //@ts-ignore
            const owners = data[2] as string[]; // array of felt

            // Ensure collection exists (insert stub if missing)
            const collection = await db.query.collections.findFirst({
              where: eq(schema.collections.id, collectionId),
            });

            if (!collection) {
              await db
                .insert(schema.collections)
                // @ts-ignore
                .values({
                  id: collectionId,
                  creator: "0x0",
                  metadataUri: null,
                  createdAtBlock: endCursor?.orderKey,
                  indexerSource
                })
                .onConflictDoNothing();
            }

            // Upsert multiple tokens
            for (let i = 0; i < tokenIds.length; i++) {
              const tokenId = `${indexerSource}_${BigInt(tokenIds[i]).toString()}`;
              const owner = feltToAddress(owners[i]);

              await db
                .insert(schema.assets)
                // @ts-ignore
                .values({
                  id: tokenId,
                  collectionId,
                  owner,
                  tokenUri: null, // batch mint often has no URIs
                  mintedAtBlock: endCursor?.orderKey,
                  indexerSource
                })
                .onConflictDoUpdate({
                  target: schema.assets.id,
                  set: {
                    owner,
                    mintedAtBlock: endCursor?.orderKey as any,
                  },
                });
            }

            break;
          }

          case getSelector("TokenBurned"): {
            const tokenId = `${indexerSource}_${BigInt(data[1]).toString()}`;

            await db.delete(schema.assets).where(eq(schema.assets.id, tokenId));

            break;
          }

          case getSelector("Transfer"): {
            const from = feltToAddress(data[0]);
            const to = feltToAddress(data[1]);
            const tokenId = `${indexerSource}_${BigInt(data[2]).toString()}`;

            await db
              .update(schema.assets)
              .set({ owner: to })
              .where(eq(schema.assets.id, tokenId));

            const transferId = `${block.header.blockNumber}_${event.transactionHash}_${event.eventIndex}`;
            await db
              .insert(schema.transfers)
              // @ts-ignore
              .values({
                id: transferId,
                tokenId,
                from,
                indexerSource,
                to,
                block: block.header.blockNumber,
              })
              .onConflictDoNothing(); // so reindexing doesn't duplicate

            break;
          }

          default: {
            logger.info("❓ Unknown event in transform", {
              selector,
              source: eventSource,
              address: event.address,
              keys: event.keys,
              data,
              blockNumber: block.header.blockNumber,
              indexerSource
            });
            break;
          }
        }
      }
    },
  });
}
