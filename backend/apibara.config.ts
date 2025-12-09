import { defineConfig } from "apibara/config";

export default defineConfig({
  /**
   * This config caters for medialanoMippMainnet and medialano-app
   * This will be used on deployment
   * contract address can be mainnet or sepolia whichver
   * mainnet streamurl should go with a mainnet contract address
   */
  runtimeConfig: {
    dappIndexer: {
      streamUrl: process.env.STREAM_URL || "https://sepolia.starknet.a5a.ch",
      startingBlock: Number(process.env.STARTING_BLOCK) || 0,
      contractAddress: process.env.CONTRACT_ADDRESS as `0x${string}`,
    },
    medialanoMippMainnet: {
      startingBlock: Number(process.env.STARTING_BLOCK) || 0,
      streamUrl: "https://mainnet.starknet.a5a.ch",
      contractAddress: process.env.CONTRACT_ADDRESS as `0x${string}`,
    },
  },

  /**
   * This preset will be used for testing locally
   * Ideally testing should always be on seplolia unless other need arise for quick debug
   * sepolia streamurl should go with a sepolia contract address
   */
  presets: {
    sepolia: {
      runtimeConfig: {
        medialanoMippMainnet: {
          startingBlock: Number(process.env.STARTING_BLOCK) || 0,
          streamUrl: "https://sepolia.starknet.a5a.ch",
          contractAddress: process.env.CONTRACT_ADDRESS as `0x${string}`,
        },
        dappIndexer: {
          streamUrl:
            process.env.STREAM_URL || "https://sepolia.starknet.a5a.ch",
          startingBlock: Number(process.env.STARTING_BLOCK) || 0,
          contractAddress: process.env.CONTRACT_ADDRESS as `0x${string}`,
        },
      },
    },
  },
});
