# MIP by Mediolano

Fast, secure and free! Transform your content into protected intellectual property with frictionless tokenization on #Starknet

MIP empowers artists, creators, and organizations protect their creative work and make money from it — without needing to understand anything about cryptocurrency or even technology.

It’s built using powerful tools that work behind the scenes to keep costs free, transactions fast, and your ownership secure. With MIP, anyone can turn their creative content—like music, art, writing, or videos—into digital assets that are protected and easy to share or sell.

MIP integrates Mediolano Protocol to enable instant tokenization and protection of creative works in accordance with the Berne Convention (1886), which spans 181 countries. This legal infrastructure guarantees global recognition of authorship and provides verifiable proof of ownership for 50 to 70 years, depending on the jurisdiction.


![mip-mobile-dapp](https://github.com/user-attachments/assets/a910cb00-cdb9-449b-a1a1-c9f8101a482a)



# Mediolano - Programmable IP for the Integrity Web

Governed by a DAO (Decentralized Autonomous Organization), Mediolano champions transparent, decentralized decision-making in alignment with core web3 and cypherpunk principles. Our mission is to foster long-term value and sustainability for the entire ecosystem—from users to partners—by operating in the collective interest of the network.

<a href="https://mediolano.xyz">Website mediolano.xyz</a>


## Roadmap

- [x] Starknet Ignition **24.9**

- [x] MIP Protocol @ Starknet Sepolia **24.11**

- [x] Mediolano Dapp @ Starknet Sepolia **24.11**

- [x] Programmable IP Contracts **25.02**

- [x] MIP Dapp @ Starknet Sepolia **25.06**

- [X] MIP Protocol @ Starknet Mainnet **25.07**

- [X] MIP Collections Protocol @ Starknet Sepolia **25.07**

- [X] MIP Dapp @ Starknet Mainnet **25.08**

- [X] MIP Collections Protocol @ Starknet Mainnet **25.08**

- [ ] Mediolano Dapp @ Starknet Mainnet **25.09**

- [ ] Medialane Protocol @ Starknet Sepolia **25.08**

- [ ] Medialane Dapp @ Starknet Sepolia **25.09**

- [ ] Medialane Protocol @ Starknet Mainnet **25.11**

- [ ] Medialane Dapp @ Starknet Mainnet **25.11**


## Contributing

We are building open-source Integrity Web with the amazing **OnlyDust** platform. Check https://app.onlydust.com/p/mediolano for more information.

We also have a Telegram group focused to support development: https://t.me/mediolanoapp

Ccontributions are **greatly appreciated**. If you have a feature or suggestion that would our plattform better, please fork the repo and create a pull request with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/Feature`)
3. Commit your Changes (`git commit -m 'Add some Feature'`)
4. Push to the Branch (`git push origin feature/YourFeature`)
5. Open a Pull Request


## Getting Started

### IPFS Configuration

The MIP dApp now supports IPFS storage for collection metadata and images. To enable IPFS functionality, you'll need to configure server-side environment variables:

Create a `.env.local` file in your project root and add:

```bash
# Pinata IPFS Service Configuration (recommended)
# Note: These are server-side only - do NOT use NEXT_PUBLIC_ prefix
PINATA_JWT=your_pinata_jwt_token
# OR use API key method
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Optional: Custom IPFS Gateway (this one can be public)
NEXT_PUBLIC_PINATA_GATEWAY=https://your-custom-gateway.com/ipfs/
```

#### Getting Pinata Credentials:

1. Sign up for a free account at [pinata.cloud](https://pinata.cloud)
2. Go to API Keys section in your dashboard
3. Create a new API key with pinning permissions
4. Use the JWT token (recommended) or API Key + Secret

> **Note:** If IPFS is not configured, the app will fall back to development mode with simulated IPFS hashes for testing.

### Running locally

Dapp requirements:
- Next.js 15
- React 19
- Node.js 18.18 or later.
- macOS, Windows (including WSL), and Linux are supported.

Clone the repository to your local machine:

```bash
git clone https://github.com/mediolano-app/mip-dapp.git
```
Install dependencies for Next.js 15 + React 19:

```bash
npm install --force
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

<hr>

Quick links:
<br>
<a href="https://ip.mediolano.app">Mediolano Dapp</a><br>
<a href="https://x.com/mediolanoapp">X / Twitter</a><br>
<a href="https://t.me/MediolanoStarknet">Telegram</a>
