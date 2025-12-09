# NFT Indexer API Documentation

A comprehensive API for querying indexed NFT data from Starknet contracts using Fastify and Drizzle ORM.

## Features

- **Assets API**: Query NFTs by owner, collection, or search
- **Collections API**: Query collections by creator or search
- **Transfers API**: Query transfer history by token or address
- **Stats API**: Get analytics and statistics
- Support for multiple indexer sources (MEDIALANO-DAPP, MEDIALANO-MIPP)
- Pagination support for all endpoints
- Comprehensive filtering and sorting options

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Environment variables configured

### Installation
Read the README.MD.

## API Endpoints

### Assets

#### Get Assets by Owner

```
GET /assets/owner/:owner
```

Query parameters:
- `indexerSource` (optional): Filter by indexer source ("MEDIALANO-DAPP" | "MEDIALANO-MIPP")
- `collectionId` (optional): Filter by collection ID
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort field ("mintedAtBlock" | "id", default: "mintedAtBlock")
- `sortOrder` (optional): Sort direction ("asc" | "desc", default: "desc")

**Example:**
```bash
curl "http://localhost:3000/assets/owner/0x1234...?limit=10&indexerSource=MEDIALANO-DAPP"
```

**Response:**
```json
{
  "data": [
    {
      "id": "MEDIALANO-DAPP_123",
      "collectionId": "MEDIALANO-DAPP_456",
      "owner": "0x1234...",
      "tokenUri": "ipfs://...",
      "mintedAtBlock": 12345,
      "indexerSource": "MEDIALANO-DAPP",
      "collection": {
        "id": "MEDIALANO-DAPP_456",
        "creator": "0x5678...",
        "metadataUri": "ipfs://...",
        "createdAtBlock": 12300,
        "indexerSource": "MEDIALANO-DAPP"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Get Single Asset

```
GET /assets/:id
```

**Example:**
```bash
curl "http://localhost:3000/assets/MEDIALANO-DAPP_123"
```

#### Get All Assets

```
GET /assets
```

Query parameters:
- `indexerSource` (optional): Filter by indexer source
- `collectionId` (optional): Filter by collection ID
- `search` (optional): Search in asset IDs
- `limit`, `offset`, `sortBy`, `sortOrder`: Same as above

### Collections

#### Get Collections by Creator

```
GET /collections/creator/:creator
```

Query parameters:
- `indexerSource` (optional): Filter by indexer source
- `limit`, `offset`, `sortBy`, `sortOrder`: Pagination and sorting options

**Example:**
```bash
curl "http://localhost:3000/collections/creator/0x1234...?limit=5"
```

**Response:**
```json
{
  "data": [
    {
      "id": "MEDIALANO-DAPP_456",
      "creator": "0x1234...",
      "metadataUri": "ipfs://...",
      "createdAtBlock": 12300,
      "indexerSource": "MEDIALANO-DAPP",
      "assetCount": 150
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 5,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Get Single Collection

```
GET /collections/:id
```

Returns collection details with asset count and recent assets.

#### Get All Collections

```
GET /collections
```

Query parameters:
- `indexerSource` (optional): Filter by indexer source
- `creator` (optional): Filter by creator address
- `search` (optional): Search in collection IDs
- `limit`, `offset`, `sortBy`, `sortOrder`: Pagination and sorting options

### Transfers

#### Get Transfers by Token

```
GET /transfers/token/:tokenId
```

Query parameters:
- `limit`, `offset`: Pagination options
- `sortOrder`: Sort by block number ("asc" | "desc", default: "desc")

**Example:**
```bash
curl "http://localhost:3000/transfers/token/MEDIALANO-DAPP_123"
```

**Response:**
```json
{
  "data": [
    {
      "id": "12345_0x789..._1",
      "tokenId": "MEDIALANO-DAPP_123",
      "from": "0x0000...",
      "to": "0x1234...",
      "block": 12345,
      "indexerSource": "MEDIALANO-DAPP",
      "asset": {
        "id": "MEDIALANO-DAPP_123",
        "collectionId": "MEDIALANO-DAPP_456",
        "tokenUri": "ipfs://...",
        "owner": "0x1234..."
      }
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Get All Transfers

```
GET /transfers
```

Query parameters:
- `tokenId` (optional): Filter by token ID
- `from` (optional): Filter by sender address
- `to` (optional): Filter by recipient address
- `indexerSource` (optional): Filter by indexer source
- `limit`, `offset`, `sortBy`, `sortOrder`: Pagination and sorting options

### Statistics

#### Get Overall Stats

```
GET /stats
```

**Example Response:**
```json
{
  "data": {
    "totalAssets": 1250,
    "totalCollections": 45,
    "totalTransfers": 2100,
    "assetsByIndexer": [
      {
        "indexerSource": "MEDIALANO-DAPP",
        "count": 800
      },
      {
        "indexerSource": "MEDIALANO-MIPP",
        "count": 450
      }
    ],
    "collectionsByIndexer": [
      {
        "indexerSource": "MEDIALANO-DAPP",
        "count": 44
      },
      {
        "indexerSource": "MEDIALANO-MIPP",
        "count": 1
      }
    ],
    "recentActivity": [
      {
        "id": "12346_0x789..._1",
        "tokenId": "MEDIALANO-DAPP_124",
        "from": "0x1111...",
        "to": "0x2222...",
        "block": 12346,
        "indexerSource": "MEDIALANO-DAPP"
      }
    ]
  }
}
```

#### Get Stats by Indexer

```
GET /stats/indexer?indexerSource=MEDIALANO-DAPP
```

Returns detailed statistics for a specific indexer including top collections, top owners, and recent mints.

### Health Check

```
GET /health
```

Returns server health status.

## Response Format

All API responses follow this format:

```json
{
  "data": { /* response data */ },
  "pagination": { /* pagination info for list endpoints */ }
}
```

Error responses:
```json
{
  "error": "Error message"
}
```

## HTTP Status Codes

- `200 OK`: Successful request
- `404 Not Found`: Resource not found
- `400 Bad Request`: Invalid request parameters
- `500 Internal Server Error`: Server error

## Filtering and Sorting

### Indexer Sources

All endpoints support filtering by `indexerSource`:
- `MEDIALANO-DAPP`: Assets from the main dApp contract
- `MEDIALANO-MIPP`: Assets from the MIP contract

### Pagination

All list endpoints support pagination:
- `limit`: Number of results (1-100)
- `offset`: Number of results to skip
- Response includes `hasMore` boolean for easy pagination

### Sorting

List endpoints support sorting:
- `sortBy`: Field to sort by (varies by endpoint)
- `sortOrder`: "asc" or "desc"

## Examples

### Get all NFTs owned by an address
```bash
curl "http://localhost:3000/assets/owner/0x1234567890abcdef?limit=50&sortOrder=desc"
```

### Get collections created by an address from DAPP indexer only
```bash
curl "http://localhost:3000/collections/creator/0x1234567890abcdef?indexerSource=MEDIALANO-DAPP"
```

### Get transfer history for a specific NFT
```bash
curl "http://localhost:3000/transfers/token/MEDIALANO-DAPP_123"
```

### Search for assets in a specific collection
```bash
curl "http://localhost:3000/assets?collectionId=MEDIALANO-DAPP_456&limit=100"
```

### Get recent activity across all indexers
```bash
curl "http://localhost:3000/transfers?limit=20&sortBy=block&sortOrder=desc"
```