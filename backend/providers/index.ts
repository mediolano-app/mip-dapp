import { RpcProvider } from "starknet";

// Set up StarkNet provider for contract calls
export const provider = new RpcProvider({
  nodeUrl: process.env.RPC_URL,
});
