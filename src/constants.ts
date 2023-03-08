export const HOST = "server-sea.bombcrypto.io";
export const PORT = 443;
export const ZONE = "BomberGameZone";
export const SALT_KEY = "f17e4e44f7bbc229fdc2d2f55728abba";
export const DATE_OFFSET = 62135596800000;
export const VERSION_CODE = 23030711;
export const SERVERS = ["na", "sea", "sa"];
export const LC = "";

//export const WEB3_RPC = "https://polygon-rpc.com";
export const WEB3_RPC = "https://rpc-mainnet.maticvigil.com";

export const BLOCK_REWARD_TYPE_BCOIN_POLYGON = 1;
export const CONTRACT_APPROVE_CLAIM =
    "0x83b5e78c10257bb4990eba73e00bbc20c5581745";
export const CONTRACT_RESET_SHIELD =
    "0x27313635e6b7aa3cc8436e24be2317d4a0e56beb";
export const ADDRESS_BOMB = "0x7e396e19322de2eda8ca300b436ed4eca955c366";
export const CONTRACT_BOMB = "0xb2c63830d4478cb331142fac075a39671a5541dc";
export const CONTRACT_MATIC = "0x0000000000000000000000000000000000001010";
export const CONTRACT_USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
export const ABI_APPROVE_CLAIM: any = [
    {
        inputs: [
            {
                internalType: "uint256",
                name: "tokenType",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "nonce",
                type: "uint256",
            },
            {
                internalType: "uint256[]",
                name: "details",
                type: "uint256[]",
            },
            {
                internalType: "bytes",
                name: "signature",
                type: "bytes",
            },
        ],
        name: "claimTokens",
        type: "function",
    },
];
export const ABI_RESET_SHIELD_HERO: any = [
    {
        inputs: [{ internalType: "address", name: "user", type: "address" }],
        name: "getTotalRockByUser",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "idHeroS", type: "uint256" },
            { internalType: "uint256", name: "numRock", type: "uint256" },
        ],
        name: "resetShieldHeroS",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint8[6]", name: "value", type: "uint8[6]" }],
        name: "setNumRockResetShield",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
