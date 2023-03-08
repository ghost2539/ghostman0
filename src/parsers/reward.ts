const REWARD_MAP = {
    BOMBERMAN: "Bomberman",
    BCOIN: "BCoin",
    BCOIN_DEPOSITED: "BCoin Deposited",
    SENSPARK: "Senspark",
    MSPc: "MSPc",
    BOSS_TICKET: "BOSS TICKET",
    PVP_TICKET: "PVP TICKET",
    COIN: "COIN",
    NFT_PVP: "NFT PVP",
    LUS: "Lus",
    WOFM: "WOFM",
    LUS_NFT: "Lus NFT",
    KEY: "Key",
} as const;

export type ERewardType =
    | typeof REWARD_MAP[keyof typeof REWARD_MAP]
    | "Unknown";

export function parseRewardType(reward: string): ERewardType {
    function isRewardKey(reward: string): reward is keyof typeof REWARD_MAP {
        return reward in REWARD_MAP;
    }

    return isRewardKey(reward) ? REWARD_MAP[reward] : "Unknown";
}

export const isFloat = (n: number): boolean => {
    return n.toString().split(".")[1] !== undefined;
};

export type IGetRewardPayloadNetwork = "BSC" | "POLYGON" | "TR";
export type IGetRewardPayload = {
    remainTime: number;
    type: ERewardType;
    value: number;
    claimPending: number;
    network: IGetRewardPayloadNetwork;
};
export type IApproveClaimPayload = {
    amount: number;
    signature: string;
    tokenType: number;
    details: string[];
    nonce: number;
};
export type ISuccessClaimRewardSuccessPayload = {
    received: number;
};

export type ICoinDetailPayload = {
    mined: number;
    invested: number;
    rewards: number;
};

export type IWeb3ApproveClaimParams = {
    tokenType: number;
    amount: number;
    nonce: number;
    details: string[];
    signature: string;
};
