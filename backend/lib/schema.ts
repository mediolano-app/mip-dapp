import { pgTable, varchar, bigint, text, timestamp } from "drizzle-orm/pg-core";

export const cursorTable = pgTable("cursor_table", {
  id: text("id").primaryKey(), // "nft_sepolia", "mip_sepolia", etc.
  endCursor: bigint("end_cursor", { mode: "number" }).notNull(),
});

export const collections = pgTable("collections", {
  id: varchar("id", { length: 255 }).primaryKey(), // collectionId
  creator: varchar("creator", { length: 255 }).notNull(),
  metadataUri: text("metadata_uri"),
  createdAtBlock: bigint("created_at_block", { mode: "number" }).notNull(),
  // Add indexer source to distinguish between nft and mip contracts
  indexerSource: varchar("indexer_source", { length: 50 }).notNull(), // "medialano-dapp", "medialano-mip"
});

export const assets = pgTable("assets", {
  id: varchar("id", { length: 255 }).primaryKey(), // tokenId
  collectionId: varchar("collection_id", { length: 255 })
    .references(() => collections.id)
    .notNull(),
  owner: varchar("owner", { length: 255 }).notNull(),
  tokenUri: text("token_uri"),
  mintedAtBlock: bigint("minted_at_block", { mode: "number" }).notNull(),
  // Add indexer source
  indexerSource: varchar("indexer_source", { length: 50 }).notNull(), // "medialano-dapp", "medialano-mip"
});

export const transfers = pgTable("transfers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenId: varchar("token_id", { length: 255 })
    .references(() => assets.id)
    .notNull(),
  from: varchar("from", { length: 255 }).notNull(),
  to: varchar("to", { length: 255 }).notNull(),
  block: bigint("block", { mode: "number" }).notNull(),
  // Add indexer source
  indexerSource: varchar("indexer_source", { length: 50 }).notNull(), // "medialano-dapp", "medialano-mip"
});

export const reports = pgTable("reports", {
  id: varchar("id", { length: 255 }).primaryKey(), // reportId
  reportType: varchar("report_type", { length: 100 }).notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // "asset", "collection", "profile"
  contentId: varchar("content_id", { length: 255 }).notNull(),
  contentTitle: text("content_title").notNull(),
  contentOwner: varchar("content_owner", { length: 255 }),
  reporterWallet: varchar("reporter_wallet", { length: 255 }).notNull(),
  reporterUserId: varchar("reporter_user_id", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending", "under_review", "resolved", "dismissed"
  blockchainTxHash: varchar("blockchain_tx_hash", { length: 255 }),
  source: varchar("source", { length: 50 }).notNull().default("mip-dapp"),
  version: varchar("version", { length: 10 }).notNull().default("1.0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Optional: Define indexer sources as constants
export const INDEXER_SOURCES = {
  "MEDIALANO-DAPP": "MEDIALANO-DAPP",
  "MEDIALANO-MIPP": "MEDIALANO-MIPP",
} as const;

export type IndexerSource = typeof INDEXER_SOURCES[keyof typeof INDEXER_SOURCES];