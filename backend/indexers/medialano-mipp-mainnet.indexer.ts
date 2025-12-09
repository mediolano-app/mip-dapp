import { defineIndexer } from "apibara/indexer";
import { getSelector } from "@apibara/starknet";
import { useLogger } from "apibara/plugins";
import { StarknetStream } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";
import * as schema from "../lib/schema";
import { feltToAddress } from "../lib/util";
import { drizzleStorage } from "@apibara/plugin-drizzle";
import { db } from "../lib/db";
import { eq } from "drizzle-orm";
import { INDEXER_SOURCES } from "../lib/schema";
import { Contract } from "starknet";
import { abi } from "abi";
import { provider } from "providers";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  const { streamUrl, startingBlock, contractAddress } =
    runtimeConfig["medialanoMippMainnet"];
  const indexerSource = INDEXER_SOURCES["MEDIALANO-MIPP"];
  const contract = new Contract(abi, contractAddress, provider);

  return defineIndexer(StarknetStream)({
    streamUrl,
    finality: "accepted",
    startingBlock: BigInt(startingBlock),
    filter: {
      events: [
        {
          address: contractAddress as `0x${string}`,
          // Only listen for Transfer events (which includes mints)
          keys: [getSelector("Transfer")],
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

      // Ensure the MIP "collection" exists
      const MIP_COLLECTION_ID = "MIP-COLLECTION";
      await ensureMipCollectionExists(endCursor?.orderKey);

      for (const event of events) {
        const selector = event.keys[0];

        logger.info("🔍 Processing MIP event", {
          address: event.address,
          selector,
          keys: event.keys,
          data: event.data,
          blockNumber: block.header.blockNumber,
        });

        switch (selector) {
          case getSelector("Transfer"): {
            // Extract data from keys (Transfer event puts data in keys, not data array)
            const from = feltToAddress(event.keys[1]); // keys[1] = from
            const to = feltToAddress(event.keys[2]); // keys[2] = to
            const tokenId = BigInt(event.keys[3]).toString(); // keys[3] = token_id

            const isMint =
              from ===
              "0x0000000000000000000000000000000000000000000000000000000000000000";

            if (isMint) {
              // This is a mint - create new asset
              let tokenUri: string | null = null;

              try {
                // Call contract to get token URI
                logger.info(`📞 Fetching URI for token ${tokenId}...`);
                const result = await contract.call("token_uri", [tokenId]);
                tokenUri = result.toString(); // Convert ByteArray to string
                tokenUri = tokenUri;
              } catch (error) {
                logger.warn(`Failed to fetch URI for token ${tokenId}:`, error);
              }

              await db
                .insert(schema.assets)
                .values({
                  id: tokenId,
                  collectionId: MIP_COLLECTION_ID,
                  owner: to,
                  tokenUri,
                  // @ts-ignore
                  mintedAtBlock: endCursor?.orderKey as number,
                  indexerSource,
                })
                .onConflictDoUpdate({
                  target: schema.assets.id,
                  set: {
                    owner: to,
                    tokenUri,
                    // @ts-ignore
                    mintedAtBlock: endCursor?.orderKey as number,
                  },
                });

              logger.info(
                `🪙 Minted NFT ${tokenId} to ${to} with URI: ${tokenUri}`
              );
            } else {
              // This is a transfer - update owner
              await db
                .update(schema.assets)
                .set({ owner: to })
                .where(eq(schema.assets.id, tokenId));

              logger.info(
                `↔️ Transferred NFT ${tokenId} from ${from} to ${to}`
              );
            }

            // Record the transfer
            const transferId = `${block.header.blockNumber}_${event.transactionHash}_${event.eventIndex}`;
            await db
              .insert(schema.transfers)
              // @ts-ignore
              .values({
                id: transferId,
                tokenId,
                from,
                to,
                block: block.header.blockNumber,
                indexerSource,
              })
              .onConflictDoNothing();

            break;
          }

          default: {
            logger.info("❓ Unknown MIP event", {
              selector,
              address: event.address,
              keys: event.keys,
              data: event.data,
              blockNumber: block.header.blockNumber,
            });
            break;
          }
        }
      }
    },
  });

  // Helper function to ensure MIP collection exists
  async function ensureMipCollectionExists(orderKey: any) {
    const MIP_COLLECTION_ID = "MIP-COLLECTION";

    const existingCollection = await db.query.collections.findFirst({
      where: eq(schema.collections.id, MIP_COLLECTION_ID),
    });

    if (!existingCollection) {
      await db
        .insert(schema.collections)
        .values({
          id: MIP_COLLECTION_ID,
          creator: contractAddress, // Use contract address as "creator"
          metadataUri: "MIP Programmable NFT Contract", // Or fetch from contract
          createdAtBlock: orderKey as number,
          indexerSource,
        })
        .onConflictDoNothing();
    }
  }
}
