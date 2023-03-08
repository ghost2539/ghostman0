import {
    ExtensionRequest,
    LoginRequest,
    SFSDataType,
    SFSObject,
} from "sfs2x-api";

import { LC, SALT_KEY } from "../constants";
import { currentTimeSinceAD, hashMD5 } from "../lib";
import { Contract } from "web3-eth-contract";
export type EGameAction =
    | "USER_LOGIN"
    | "GET_BLOCK_MAP"
    | "GET_HERO_UPGRADE_POWER"
    | "PING_PONG"
    | "SYNC_BOMBERMAN"
    | "SYNC_HOUSE"
    | "ACTIVE_HOUSE"
    | "START_PVE"
    | "STOP_PVE"
    | "GET_ACTIVE_BOMBER"
    | "START_EXPLODE"
    | "START_EXPLODE_V2"
    | "GO_SLEEP"
    | "GO_HOME"
    | "GO_WORK"
    | "GET_REWARD"
    | "COIN_DETAIL"
    | "GET_STORY_LEVEL_DETAIL"
    | "APPROVE_CLAIM"
    | "GET_STORY_MAP"
    | "CONFIRM_CLAIM_REWARD_SUCCESS"
    | "START_STORY_EXPLODE"
    | "ENEMY_TAKE_DAMAGE"
    | "ENTER_DOOR";

export interface ISendTransactionWeb3 {
    dataTransaction: any;
    gasLimit: number;
    contract: Contract;
}

export function hashGameMessage(
    wallet: string,
    action: EGameAction,
    messageId: number
) {
    const time = currentTimeSinceAD();
    const message = `${wallet}|${messageId}|${action}|${time}|${SALT_KEY}`;
    return [hashMD5(message), time];
}

export function hashLoginMessage(pln: string) {
    const time = currentTimeSinceAD();
    const message = `${pln}|LOGIN|${time}|${SALT_KEY}`;
    return [hashMD5(message), time];
}

export function makeGameMessage(
    wallet: string,
    action: EGameAction,
    messageId: number,
    data = new SFSObject()
) {
    const params = new SFSObject();
    const [hash, timestamp] = hashGameMessage(wallet, action, messageId);

    params.put("data", data, SFSDataType.SFS_OBJECT);
    params.put("id", messageId, SFSDataType.INT);
    params.put("hash", hash, SFSDataType.UTF_STRING);
    params.put("timestamp", timestamp, SFSDataType.LONG);

    return new ExtensionRequest(action, params);
}

export function makeLoginMessage(
    pln: string,
    wallet?: string,
    token?: string,
    rede?: string,
    version?: number,
    signature?: string,
    lt?: number
) {
    const data = new SFSObject();
    const params = new SFSObject();
    const [hash, timestamp] = hashLoginMessage(pln);

    // data.put("pln", pln, SFSDataType.UTF_STRING);
    data.put("pln", wallet, SFSDataType.UTF_STRING);
    data.put("token", token, SFSDataType.UTF_STRING);
    data.put("data_type", rede, SFSDataType.UTF_STRING);
    data.put("device_type", "WEB", SFSDataType.UTF_STRING);
    // data.put("password", password, SFSDataType.UTF_STRING);
    data.put("version_code", version, SFSDataType.INT);
    data.put("lt", lt, SFSDataType.INT);
    data.put("slogan", "senspark", SFSDataType.UTF_STRING);
    data.put("signature", signature, SFSDataType.UTF_STRING);

    params.put("lc", LC, SFSDataType.UTF_STRING);
    params.put("data", data, SFSDataType.SFS_OBJECT);
    params.put("hash", hash, SFSDataType.UTF_STRING);
    params.put("timestamp", timestamp, SFSDataType.LONG);

    //return new LoginRequest(pln, "", params);
    return new LoginRequest(wallet ? wallet : pln, "", params);
}
