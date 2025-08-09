import { RpcProvider } from "starknet";
export const CONTRACTS = {
  ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  USDC: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
  USDT: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
  STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  MEDIOLANO:
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MIP ||
    "0x04b67deb64d285d3de684246084e74ad25d459989b7336786886ec63a28e0cd4",
  COLLECTION_FACTORY:
    process.env.NEXT_PUBLIC_COLLECTION_FACTORY_ADDRESS ||
    "0x02f751e0c4f221ffcc5084af0d5f97af1d448670f57b48462d68318ea90e77e3",
};

export const provider = new RpcProvider({
  nodeUrl:
    process.env.NEXT_PUBLIC_STARKNET_RPC_URL ||
    "https://starknet-mainnet.public.blastapi.io/rpc/v0_7",
});
export const IPFS_URL = process.env.NEXT_PUBLIC_PINATA_HOST!;
