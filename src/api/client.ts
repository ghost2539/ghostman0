import got from "got";
import {
   LoggerEvent,
   LogLevel,
   LogoutRequest,
   SFSEvent,
   SFSObject,
   SmartFox,
} from "sfs2x-api";
import UserAgent from "user-agents";
import Web3 from "web3";
import { TransactionReceipt } from "web3-core";
import { Unit } from "web3-utils";
import { bot } from "..";
import { IMoreOptions } from "../bot";
import {
   ABI_APPROVE_CLAIM,
   ABI_RESET_SHIELD_HERO,
   ADDRESS_BOMB,
   CONTRACT_APPROVE_CLAIM,
   CONTRACT_BOMB,
   CONTRACT_RESET_SHIELD,
   PORT,
   WEB3_RPC,
   ZONE,
} from "../constants";
import { makeException } from "../err";
import {
   askAndParseEnv,
   getDurationInMilliseconds,
   getGasPolygon,
   parseBoolean,
   retryWeb3,
} from "../lib";
import { logger } from "../logger";
import {
   Hero,
   IGetBlockMapPayload,
   IHeroUpdateParams,
   IStoryHeroParams,
} from "../model";
import {
   IEnemies,
   IEnemyTakeDamageInput,
   IStoryDetailsPayload,
   IStoryMap,
   ISyncHousePayload,
} from "../parsers";
import {
   IEnemyTakeDamagePayload,
   IEnterDoorPayload,
   IStartExplodeInput,
   IStartExplodePayload,
   IStartExplodeReward,
   IStartStoryExplodeInput,
   IStartStoryExplodePayload,
} from "../parsers/explosion";
import {
   IGetActiveBomberPayload,
   ISyncBombermanPayload,
} from "../parsers/hero";
import {
   IJwtLoginResponse,
   ILoginParams,
   IVerifyTokenResponse,
} from "../parsers/login";
import {
   IApproveClaimPayload,
   ICoinDetailPayload,
   IGetRewardPayload,
   IGetRewardPayloadNetwork,
   ISuccessClaimRewardSuccessPayload,
   IWeb3ApproveClaimParams,
   parseRewardType,
} from "../parsers/reward";
import { EGameAction, ISendTransactionWeb3 } from "./base";
import {
   ISerializedRequestController,
   IUniqueRequestController,
   makeSerializedPromise,
   makeUniquePromise,
   rejectSerializedPromise,
   rejectUniquePromise,
   resolveSerializedPromise,
   resolveUniquePromise,
} from "./promise";
import {
   makeActiveBomber,
   makeActiveHouseRequest,
   makeApproveClaim,
   makeApproveConfirmClaimRewardSuccess,
   makeCoinDetailRequest,
   makeEnemyTakeDamageRequest,
   makeEnterDoorRequest,
   makeGetActiveBomberRequest,
   makeGetBlockMapRequest,
   makeGetHeroUpgradePowerRequest,
   makeGetRewardRequest,
   makeGetStoryLevelDetail,
   makeGetStoryMap,
   makeGoHomeRequest,
   makeGoSleepRequest,
   makeGoWorkRequest,
   makeLoginRequest,
   makeLoginSignature,
   makePingPongRequest,
   makeStartExplodeExplodeRequest,
   makeStartExplodeRequest,
   makeStartExplodeV2Request,
   makeStartPVERequest,
   makeStopPVERequest,
   makeSyncBombermanRequest,
   makeSyncHouseRequest,
} from "./requests";

type IExtensionResponseParams = {
   cmd: EGameAction;
   params: SFSObject;
};

type ILoginErrorParams = {
   errorCode: number;
};

type IConnectionParams = {
   success: boolean;
};

type EventHandlerMap = {
   connection: () => void;
   connectionFailed: () => void;
   connectionLost: () => void;
   login: () => void;
   approveClaim: (params: IApproveClaimPayload) => void;
   activeBomber: () => void;
   confirmClaimRewardSuccess: (
      params: ISuccessClaimRewardSuccessPayload
   ) => void;
   loginError: (errorCode: number) => void;
   logout: () => void;
   getHeroUpgradePower: () => void;
   getBlockMap: (blocks: IGetBlockMapPayload[]) => void;
   syncHouse: (houses: ISyncHousePayload[]) => void;
   activeHouse: () => void;
   getActiveBomber: (heroes: IGetActiveBomberPayload[]) => void;
   syncBomberman: (heroes: ISyncBombermanPayload[]) => void;
   startPVE: () => void;
   stopPVE: () => void;
   ping: () => void;
   startExplode: (payload: IStartExplodePayload) => void;
   startExplodeV2: (payload: IStartExplodePayload) => void;
   startStoryExplode: (payload: IStartStoryExplodePayload) => void;
   enemyTakeDamage: (payload: IEnemyTakeDamagePayload) => void;
   goSleep: (payload: IHeroUpdateParams) => void;
   goHome: (payload: IHeroUpdateParams) => void;
   goWork: (payload: IHeroUpdateParams) => void;
   getReward: (payload: IGetRewardPayload[]) => void;
   coinDetail: (payload: ICoinDetailPayload) => void;
   getStoryDetails: (payload: IStoryDetailsPayload) => void;
   getStoryMap: () => void;
   enterDoor: () => void;
   messageError: (command: EGameAction, errorCode: number) => void;
};

type IClientHandlers = {
   [K in keyof EventHandlerMap]: EventHandlerMap[K][];
};

type IEventHandler<T extends keyof EventHandlerMap> = {
   [K in T]: {
      event: K;
      handler: EventHandlerMap[K];
   };
}[T];

type IClientController = {
   connect: IUniqueRequestController<void>;
   disconnect: IUniqueRequestController<void>;
   login: IUniqueRequestController<void>;
   approveClaim: IUniqueRequestController<IApproveClaimPayload>;
   activeBomber: IUniqueRequestController<void>;
   confirmClaimRewardSuccess: IUniqueRequestController<ISuccessClaimRewardSuccessPayload>;
   getHeroUpgradePower: IUniqueRequestController<void>;
   logout: IUniqueRequestController<void>;
   getBlockMap: IUniqueRequestController<IGetBlockMapPayload[]>;
   syncHouse: IUniqueRequestController<ISyncHousePayload[]>;
   activeHouse: IUniqueRequestController<void>;
   getActiveHeroes: IUniqueRequestController<IGetActiveBomberPayload[]>;
   syncBomberman: IUniqueRequestController<ISyncBombermanPayload[]>;
   startPVE: IUniqueRequestController<void>;
   stopPVE: IUniqueRequestController<void>;
   ping: IUniqueRequestController<void>;
   startExplode: ISerializedRequestController<IStartExplodePayload>;
   startExplodeV2: ISerializedRequestController<IStartExplodePayload>;
   startStoryExplode: ISerializedRequestController<
      IStartStoryExplodePayload | undefined
   >;
   enemyTakeDamage: ISerializedRequestController<IEnemyTakeDamagePayload>;
   goSleep: ISerializedRequestController<IHeroUpdateParams>;
   goHome: ISerializedRequestController<IHeroUpdateParams>;
   getReward: IUniqueRequestController<IGetRewardPayload[]>;
   coinDetail: IUniqueRequestController<ICoinDetailPayload>;
   goWork: ISerializedRequestController<IHeroUpdateParams>;
   getStoryMap: IUniqueRequestController<IStoryMap>;
   getStoryDetails: IUniqueRequestController<IStoryDetailsPayload>;
   enterDoor: IUniqueRequestController<IEnterDoorPayload>;
};

export class Client {
   private handlers!: IClientHandlers;
   private controller!: IClientController;
   private messageId!: number;
   private timeout: number;
   private sfs: SmartFox;
   public loginParams: ILoginParams;
   private apiBaseHeaders;
   private modeAmazon = false;
   private moreParams;
   private web3;

   constructor(
      loginParams: ILoginParams,
      timeout = 0,
      modeAmazon = false,
      moreParams: IMoreOptions
   ) {
      this.moreParams = moreParams;
      this.modeAmazon = modeAmazon;
      const userAgent = new UserAgent();
      this.apiBaseHeaders = {
         origin: "https://app.bombcrypto.io",
         referer: "https://app.bombcrypto.io",
         "sec-ch-ua": ` " Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"`,
         "sec-ch-ua-mobile": "?0",
         "sec-ch-ua-platform": `"Windows"`,
         "sec-fetch-dest": "empty",
         "sec-fetch-mode": "cors",
         "sec-fetch-site": "same-site",
         "content-type": "application/json",
         "user-agent": userAgent.toString(),
      };
      this.web3 = new Web3(WEB3_RPC);
      this.sfs = {} as SmartFox;

      this.timeout = timeout;
      this.loginParams = loginParams;
   }

   get walletId() {
      return this.loginParams.wallet as string;
   }

   get isConnected() {
      return this.sfs.isConnected;
   }

   get isLoggedIn() {
      return "mySelf" in this.sfs && this.sfs.mySelf !== null;
   }

   on<T extends keyof EventHandlerMap>({ event, handler }: IEventHandler<T>) {
      const selected = this.handlers[event] as IEventHandler<T>["handler"][];
      return this.pushHandler(selected, handler);
   }

   async connect(timeout = 0) {
      if (this.isConnected) return;

      return await makeUniquePromise(
         this.controller.connect,
         () => this.sfs.connect(),
         timeout || this.timeout
      );
   }

   async disconnect(timeout = 0) {
      if (!this.isConnected) return;

      const result = await makeUniquePromise(
         this.controller.disconnect,
         () => this.sfs.disconnect(),
         timeout || this.timeout
      );

      return result;
   }

   async removeAllPromises() {
      Object.values(this.controller).map((value) => {
         value.current?.reject(new Error("Canceled"));
      });
   }

   async createServer(server: string) {
      this.sfs = new SmartFox({
         host: `server-${server}.bombcrypto.io`,
         port: PORT,
         zone: ZONE,
         debug: askAndParseEnv("DEBUG", parseBoolean, false),
         useSSL: true,
      });
      this.sfs.setClientDetails("Unity WebGL", "");
      this.wipe();
      this.connectEvents();
   }

   async getJwtToken() {
      try {
         const { type } = this.loginParams;
         let resultToken: IJwtLoginResponse;

         if (type == "wallet") {
            const { privateKey, wallet } = this.loginParams;

            const dapp = await got
               .get(
                  `https://api.bombcrypto.io/gateway/auth/dapp/token?address=${wallet}`,
                  {
                     headers: this.apiBaseHeaders,
                  }
               )
               .json<{ message: string }>();

            const signature = makeLoginSignature(privateKey, dapp.message);

            resultToken = await got
               .post(
                  "https://api.bombcrypto.io/gateway/auth/dapp/verify-signature",
                  {
                     json: {
                        address: wallet,
                        signature,
                     },
                     headers: this.apiBaseHeaders,
                  }
               )
               .json<IJwtLoginResponse>();
            this.loginParams.signature = signature;
         } else {
            const { password, username } = this.loginParams;
            resultToken = await got
               .post("https://api.bombcrypto.io/gateway/auth/tr/login", {
                  json: {
                     username,
                     password,
                  },
                  headers: this.apiBaseHeaders,
               })
               .json<IJwtLoginResponse>();
         }
         logger.info(`New token: ${resultToken.message.token}`);

         const resultVerify = await got
            .get("https://api.bombcrypto.io/gateway/auth/tr/verify-token", {
               headers: {
                  ...this.apiBaseHeaders,
                  authorization: `Bearer ${resultToken.message.token}`,
               },
            })
            .json<IVerifyTokenResponse>();

         if (!resultVerify.message.address) {
            await bot.telegram.sendMessageChat(`Wallet not found`);
            throw makeException("LoginFailed", `Wallet not found`);
         }
         logger.info(`Wallet: ${resultVerify.message.address}`);
         logger.info(`User Id: ${resultVerify.message.id}`);

         if (resultVerify.message.isDeleted) {
            await bot.telegram.sendMessageChat(`Account deleted`);
            throw makeException("LoginFailed", `Account deleted`);
         }

         this.loginParams.wallet = resultVerify.message.address;
         this.loginParams.token = resultToken.message.token;
      } catch (e: any) {
         if (e.message == "Response code 401 (Unauthorized)") {
            await bot.telegram.sendMessageChat("username or password invalid");
            throw makeException("LoginFailed", "username or password invalid");
         }
         throw makeException("LoginFailed", e.message);
      }
   }

   async connectServer() {
      const resultPing = await this.getServerByPing();
      logger.info(
         `Best server found '${resultPing.server}' ping: ${resultPing.ping}ms`
      );
      await this.createServer(resultPing.server);
   }
   async login(timeout = 0) {
      if (this.isLoggedIn) return this.walletId;

      await this.getJwtToken();
      await this.connect();
      logger.info(`Network: ${this.loginParams.rede}`);
      return await makeUniquePromise(
         this.controller.login,
         () => this.sfs.send(makeLoginRequest(this.loginParams)),
         timeout || this.timeout
      );
   }
   async approveClaim(blockReward: number, timeout = 0) {
      this.ensureLoggedIn();

      return await makeUniquePromise(
         this.controller.approveClaim,
         () =>
            this.sfs.send(
               makeApproveClaim(this.walletId, this.nextId(), blockReward)
            ),
         timeout || this.timeout
      );
   }
   async activeBomber(hero: Hero, active: number, timeout = 0) {
      this.ensureLoggedIn();

      return await makeUniquePromise(
         this.controller.activeBomber,
         () =>
            this.sfs.send(
               makeActiveBomber(this.walletId, this.nextId(), hero, active)
            ),
         timeout || this.timeout
      );
   }
   async confirmClaimRewardSuccess(blockReward: number, timeout = 0) {
      this.ensureLoggedIn();

      return await makeUniquePromise(
         this.controller.confirmClaimRewardSuccess,
         () =>
            this.sfs.send(
               makeApproveConfirmClaimRewardSuccess(
                  this.walletId,
                  this.nextId(),
                  blockReward
               )
            ),
         timeout || this.timeout
      );
   }

   async getPing(server: string) {
      const start = process.hrtime();
      await got.get(`https://api.bombcrypto.io/ping/${server}`, {
         headers: this.apiBaseHeaders,
         http2: true,
      });
      await got.get(`https://api.bombcrypto.io/ping/${server}`, {
         headers: this.apiBaseHeaders,
         http2: true,
      });

      return {
         server,
         ping: getDurationInMilliseconds(start),
      };
   }
   async getServerByPing() {
      // const result = await Promise.all(
      //     SERVERS.map((server) => this.getPing(server))
      // );
      // result.sort((a, b) => a.ping - b.ping);
      return { server: this.moreParams.server as string, ping: 0 };
      // return result[0];
   }

   async logout(timeout = 0) {
      if (!this.isLoggedIn) return;

      return await makeUniquePromise(
         this.controller.logout,
         () => this.sfs.send(new LogoutRequest()),
         timeout || this.timeout
      );
   }

   getHeroUpgradePower(timeout = 0) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.getHeroUpgradePower,
         () => {
            const request = makeGetHeroUpgradePowerRequest(
               this.walletId,
               this.nextId()
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   getBlockMap(timeout = 0) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.getBlockMap,
         () => {
            const request = makeGetBlockMapRequest(
               this.walletId,
               this.nextId()
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   syncHouse(timeout = 0) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.syncHouse,
         () => {
            const request = makeSyncHouseRequest(this.walletId, this.nextId());
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }
   activeHouse(id: number, timeout = 0) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.activeHouse,
         () => {
            const request = makeActiveHouseRequest(
               id,
               this.walletId,
               this.nextId()
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   getActiveHeroes(timeout = 0) {
      logger.info("Update list heroes...");
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.getActiveHeroes,
         () => {
            const request = makeGetActiveBomberRequest(
               this.walletId,
               this.nextId()
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   syncBomberman(timeout = 0) {
      logger.info("Update list heroes...");
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.syncBomberman,
         () => {
            const request = makeSyncBombermanRequest(
               this.walletId,
               this.nextId()
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   startExplode(input: IStartExplodeInput, timeout = 0) {
      this.ensureLoggedIn();

      return makeSerializedPromise(
         this.controller.startExplode,
         () => {
            const request = makeStartExplodeRequest(
               this.walletId,
               this.nextId(),
               input
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }
   startExplodeV2(input: IStartExplodeInput, timeout = 0) {
      this.ensureLoggedIn();

      return makeSerializedPromise(
         this.controller.startExplodeV2,
         () => {
            const request = makeStartExplodeV2Request(
               this.walletId,
               this.nextId(),
               input
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }
   startStoryExplode(input: IStartStoryExplodeInput, timeout = 0) {
      this.ensureLoggedIn();

      return makeSerializedPromise(
         this.controller.startStoryExplode,
         () => {
            const request = makeStartExplodeExplodeRequest(
               this.walletId,
               this.nextId(),
               input
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }
   enemyTakeDamage(input: IEnemyTakeDamageInput, timeout = 0) {
      this.ensureLoggedIn();

      return makeSerializedPromise(
         this.controller.enemyTakeDamage,
         () => {
            const request = makeEnemyTakeDamageRequest(
               this.walletId,
               this.nextId(),
               input
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   startPVE(timeout = 0, modeAmazon: boolean) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.startPVE,
         () => {
            const request = makeStartPVERequest(
               this.walletId,
               this.nextId(),
               modeAmazon
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   stopPVE(timeout = 0) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.stopPVE,
         () => {
            const request = makeStopPVERequest(this.walletId, this.nextId());
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   ping() {
      this.ensureLoggedIn();
      logger.info("Send ping to server");

      const request = makePingPongRequest(this.walletId, this.nextId());
      this.sfs.send(request);
   }

   async sendTransactionWeb3({
      contract,
      dataTransaction,
      gasLimit,
   }: ISendTransactionWeb3) {
      const promise = new Promise<TransactionReceipt>(
         async (resolve, error) => {
            try {
               if (
                  !("privateKey" in this.loginParams) ||
                  !this.loginParams?.privateKey
               ) {
                  return false;
               }

               const account = this.web3.eth.accounts.privateKeyToAccount(
                  this.loginParams.privateKey
               );

               const transactionCount = await this.web3.eth.getTransactionCount(
                  account.address
               );

               const gasPolygon = await getGasPolygon();

               const txObject: any = {
                  nonce: parseInt(this.web3.utils.toHex(transactionCount)),
                  to: contract.options.address,
                  gasPrice: this.web3.utils.toHex(
                     this.web3.utils.toWei(gasPolygon.toString(), "gwei")
                  ),
                  data: dataTransaction.encodeABI(),
               };
               if (gasLimit) {
                  txObject[`gasLimit`] = this.web3.utils.toHex(gasLimit);
               }

               const sign = await account.signTransaction(txObject);

               if (sign.rawTransaction) {
                  this.web3.eth.sendSignedTransaction(
                     sign.rawTransaction,
                     (e, hash) => {
                        logger.info("transaction hash: " + hash);
                        if (e) {
                           return error(e);
                        }

                        const interval = setInterval(() => {
                           this.web3.eth.getTransactionReceipt(
                              hash,
                              (e, obj) => {
                                 try {
                                    if (e) {
                                       return error(e);
                                    }
                                    if (obj) {
                                       if (obj.status) {
                                          clearInterval(interval);
                                          resolve(obj);
                                          return;
                                       } else {
                                          return error("error transaction");
                                       }
                                    }
                                 } catch (e: any) {
                                    clearInterval(interval);
                                    return error(
                                       `${e.message}\n\nHash: ${hash}`
                                    );
                                 }
                              }
                           );
                        }, 1000);
                     }
                  );
               }
            } catch (e) {
               error(e);
            }
         }
      );

      return retryWeb3<TransactionReceipt>(promise);
   }

   async poolBomb() {
      const contract = new this.web3.eth.Contract(
         [
            {
               inputs: [
                  {
                     internalType: "address",
                     name: "account",
                     type: "address",
                  },
               ],
               name: "balanceOf",
               outputs: [
                  { internalType: "uint256", name: "", type: "uint256" },
               ],
               stateMutability: "view",
               type: "function",
            },
         ],
         this.web3.utils.toChecksumAddress(CONTRACT_BOMB)
      );

      const value = await contract.methods.balanceOf(ADDRESS_BOMB).call();
      return this.web3.utils.fromWei(value, "ether");
   }

   async web3Balance(contractStr: string, unit: Unit = "ether") {
      const contract = new this.web3.eth.Contract(
         [
            {
               inputs: [
                  {
                     internalType: "address",
                     name: "account",
                     type: "address",
                  },
               ],
               name: "balanceOf",
               outputs: [
                  { internalType: "uint256", name: "", type: "uint256" },
               ],
               stateMutability: "view",
               type: "function",
            },
         ],
         this.web3.utils.toChecksumAddress(contractStr)
      );

      const value = await contract.methods
         .balanceOf(this.loginParams.wallet)
         .call();
      return this.web3.utils.fromWei(value, unit);
   }

   async web3GetRock() {
      if (this.loginParams.type == "user") return null;
      const contract = new this.web3.eth.Contract(
         ABI_RESET_SHIELD_HERO,
         this.web3.utils.toChecksumAddress(CONTRACT_RESET_SHIELD)
      );
      const data = await contract.methods
         .getTotalRockByUser(this.loginParams.wallet)
         .call();
      return data;
   }
   async web3ResetShield({ id, rockRepairShield }: Hero) {
      const contract = new this.web3.eth.Contract(
         ABI_RESET_SHIELD_HERO,
         this.web3.utils.toChecksumAddress(CONTRACT_RESET_SHIELD)
      );

      const gasLimit = await contract.methods
         .resetShieldHeroS(
            this.web3.utils.toBN(id),
            this.web3.utils.toBN(rockRepairShield)
         )
         .estimateGas({ from: this.loginParams.wallet });

      const dataTransaction = await contract.methods.resetShieldHeroS(
         this.web3.utils.toBN(id),
         this.web3.utils.toBN(rockRepairShield)
      );

      return this.sendTransactionWeb3({
         contract,
         dataTransaction,
         gasLimit,
      });
   }
   async web3CreateRock(heroesIds: number[]) {
      const contract = new this.web3.eth.Contract(
         ABI_RESET_SHIELD_HERO,
         this.web3.utils.toChecksumAddress(CONTRACT_RESET_SHIELD)
      );
      const gasLimit = await contract.methods
         .createRock(heroesIds.map((id) => this.web3.utils.toBN(id)))
         .estimateGas({ from: this.loginParams.wallet });

      const dataTransaction = await contract.methods.createRock(
         heroesIds.map((id) => this.web3.utils.toBN(id))
      );

      return this.sendTransactionWeb3({
         contract,
         gasLimit,
         dataTransaction,
      });
   }
   async checkTransaction(hash: string) {
      return new Promise<boolean>((resolve) => {
         this.web3.eth.getTransactionReceipt(hash, (e, obj) => {
            if (obj) {
               return resolve(true);
            }
            return resolve(false);
         });
      });
   }
   async web3ApproveClaim({
      amount,
      details,
      nonce,
      signature,
      tokenType,
   }: IWeb3ApproveClaimParams) {
      const contract = new this.web3.eth.Contract(
         ABI_APPROVE_CLAIM,
         this.web3.utils.toChecksumAddress(CONTRACT_APPROVE_CLAIM)
      );
      const gasLimit = await contract.methods
         .claimTokens(
            this.web3.utils.toBN(tokenType),
            this.web3.utils.toWei(amount.toString(), "ether"),
            this.web3.utils.toBN(nonce),
            details,
            signature
         )
         .estimateGas({ from: this.loginParams.wallet });

      const dataTransaction = contract.methods.claimTokens(
         this.web3.utils.toBN(tokenType),
         this.web3.utils.toWei(amount.toString(), "ether"),
         this.web3.utils.toBN(nonce),
         details,
         signature
      );

      return this.sendTransactionWeb3({
         contract,
         dataTransaction,
         gasLimit,
      });
   }

   goSleep(hero: Hero, timeout = 0) {
      this.ensureLoggedIn();

      return makeSerializedPromise(
         this.controller.goSleep,
         () => {
            const request = makeGoSleepRequest(
               this.walletId,
               this.nextId(),
               hero
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   goHome(hero: Hero, timeout = 0) {
      this.ensureLoggedIn();

      return makeSerializedPromise(
         this.controller.goHome,
         () => {
            const request = makeGoHomeRequest(
               this.walletId,
               this.nextId(),
               hero
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   goWork(hero: Hero, timeout = 0) {
      this.ensureLoggedIn();

      return makeSerializedPromise(
         this.controller.goWork,
         () => {
            const request = makeGoWorkRequest(
               this.walletId,
               this.nextId(),
               hero
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   getReward(timeout = 0) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.getReward,
         () => {
            const request = makeGetRewardRequest(this.walletId, this.nextId());
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   coinDetail(timeout = 0) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.coinDetail,
         () => {
            const request = makeCoinDetailRequest(this.walletId, this.nextId());
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   getStoryDetails(timeout = 0) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.getStoryDetails,
         () => {
            const request = makeGetStoryLevelDetail(
               this.walletId,
               this.nextId()
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   getStoryMap(heroId: number, level: number, timeout = 0) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.getStoryMap,
         () => {
            const request = makeGetStoryMap(
               this.walletId,
               this.nextId(),
               heroId,
               level
            );
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   enterDoor(timeout = 0) {
      this.ensureLoggedIn();

      return makeUniquePromise(
         this.controller.enterDoor,
         () => {
            const request = makeEnterDoorRequest(this.walletId, this.nextId());
            this.sfs.send(request);
         },
         timeout || this.timeout
      );
   }

   wipe() {
      if (this.isConnected) this.sfs.disconnect();

      this.handlers = {
         connection: [],
         connectionFailed: [],
         connectionLost: [],
         login: [],
         approveClaim: [],
         activeBomber: [],
         confirmClaimRewardSuccess: [],
         loginError: [],
         logout: [],
         getHeroUpgradePower: [],
         getBlockMap: [],
         syncHouse: [],
         activeHouse: [],
         getActiveBomber: [],
         syncBomberman: [],
         startPVE: [],
         ping: [],
         stopPVE: [],
         startExplode: [],
         startExplodeV2: [],
         startStoryExplode: [],
         enemyTakeDamage: [],
         goSleep: [],
         goHome: [],
         goWork: [],
         getReward: [],
         coinDetail: [],
         getStoryDetails: [],
         getStoryMap: [],
         enterDoor: [],
         messageError: [],
      };

      this.controller = {
         connect: {
            current: undefined,
         },
         disconnect: {
            current: undefined,
         },
         login: {
            current: undefined,
         },
         approveClaim: {
            current: undefined,
         },
         activeBomber: {
            current: undefined,
         },
         confirmClaimRewardSuccess: {
            current: undefined,
         },
         logout: {
            current: undefined,
         },
         getHeroUpgradePower: {
            current: undefined,
         },
         getBlockMap: {
            current: undefined,
         },
         syncHouse: {
            current: undefined,
         },
         activeHouse: {
            current: undefined,
         },
         getActiveHeroes: {
            current: undefined,
         },
         syncBomberman: {
            current: undefined,
         },
         startPVE: {
            current: undefined,
         },
         stopPVE: {
            current: undefined,
         },
         ping: {
            current: undefined,
         },
         startExplode: {
            current: undefined,
            executors: [],
         },
         startExplodeV2: {
            current: undefined,
            executors: [],
         },
         startStoryExplode: {
            current: undefined,
            executors: [],
         },
         enemyTakeDamage: {
            current: undefined,
            executors: [],
         },
         goWork: {
            current: undefined,
            executors: [],
         },
         goSleep: {
            current: undefined,
            executors: [],
         },
         goHome: {
            current: undefined,
            executors: [],
         },
         getReward: {
            current: undefined,
         },
         coinDetail: {
            current: undefined,
         },
         getStoryDetails: {
            current: undefined,
         },
         getStoryMap: {
            current: undefined,
         },
         enterDoor: {
            current: undefined,
         },
      };

      this.messageId = 0;
   }

   private ensureLoggedIn() {
      if (!this.isLoggedIn) throw makeException("WrongUsage", "Log in first");
   }

   private nextId() {
      return this.messageId++;
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   private pushHandler<T extends (...args: any[]) => void>(
      handlers: T[],
      handler: T
   ) {
      handlers.push(handler);
      return () => handlers.splice(handlers.indexOf(handler), 1);
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   private callHandler<T extends (...args: any[]) => void>(
      handlers: T[],
      ...params: Parameters<T>
   ) {
      handlers.forEach((handler) => handler(...params));
   }

   private handleConnection(params: IConnectionParams) {
      if (params.success) {
         this.callHandler(this.handlers.connection);
         resolveUniquePromise(this.controller.connect, undefined);
      } else {
         this.callHandler(this.handlers.connectionFailed);
         rejectUniquePromise(
            this.controller.connect,
            makeException("ConnectionFailed", "Connection failed")
         );
      }
   }

   private handleLogin() {
      this.callHandler(this.handlers.login);
   }

   private handleLoginError({ errorCode }: ILoginErrorParams) {
      rejectUniquePromise(
         this.controller.login,
         makeException("LoginFailed", `Error code ${errorCode}`)
      );
      this.callHandler(this.handlers.loginError, errorCode);
   }

   private handleUserLogin() {
      resolveUniquePromise(this.controller.login, undefined);
   }

   private handleLogout() {
      resolveUniquePromise(this.controller.logout, undefined);
      this.callHandler(this.handlers.logout);
   }

   private handleGetHeroUpgradePower() {
      resolveUniquePromise(this.controller.getHeroUpgradePower, undefined);
      this.callHandler(this.handlers.getHeroUpgradePower);
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   private handleConnectionLost() {
      resolveUniquePromise(this.controller.disconnect, undefined);
      this.callHandler(this.handlers.connectionLost);
   }

   private handleGetBlockMap(params: SFSObject) {
      const data = params.getUtfString(
         this.modeAmazon ? "datas_pve_v2" : "datas_pve"
      );
      const blocks = JSON.parse(data) as IGetBlockMapPayload[];
      resolveUniquePromise(this.controller.getBlockMap, blocks);
      this.callHandler(this.handlers.getBlockMap, blocks);
   }

   private handleSyncBomberman(params: SFSObject) {
      const data = params.getSFSArray("bombers");
      const bombers = Array(data.size())
         .fill(null)
         .map((_, i) => {
            const payload = data.getSFSObject(i);
            const dataShields = payload.getSFSArray("shields");
            const shields = Array(dataShields.size());

            const dataObj = payload.getSFSObject("data");

            return {
               shields: shields.fill(null).map((_, i) => {
                  const shield = dataShields.getSFSObject(i);
                  return {
                     current: shield.getInt("current"),
                     total: shield.getInt("total"),
                     ability: shield.getInt("ability"),
                  };
               }),
               stage: payload.getInt("stage"),
               id: payload.getLong("id"),
               gen_id: payload.getUtfString("gen_id"),
               energy: payload.getInt("energy"),
               active: payload.getInt("active"),
               heroType: dataObj.getInt("hero_type"),
               restore_hp: payload.getInt("restore_hp"),
            };
         });

      resolveUniquePromise(this.controller.syncBomberman, bombers);
      this.callHandler(this.handlers.syncBomberman, bombers);
   }

   private handleGetActiveHeroes(params: SFSObject) {
      const data = params.getSFSArray("bombers");
      const bombers = Array(data.size())
         .fill(null)
         .map((_, i) => {
            const payload = data.getSFSObject(i);
            const dataShields = payload.getSFSArray("shields");
            const shields = Array(dataShields.size());

            return {
               shields: shields.fill(null).map((_, i) => {
                  const shield = dataShields.getSFSObject(i);
                  return {
                     current: shield.getInt("current"),
                     total: shield.getInt("total"),
                     ability: shield.getInt("ability"),
                  };
               }),
               stage: payload.getInt("stage"),
               id: payload.getLong("id"),
               gen_id: payload.getUtfString("gen_id"),
               energy: payload.getInt("energy"),
               heroType: payload.getInt("hero_type"),
            } as IGetActiveBomberPayload;
         });
      resolveUniquePromise(this.controller.getActiveHeroes, bombers);
      this.callHandler(this.handlers.getActiveBomber, bombers);
   }

   private handleStartExplode(params: SFSObject) {
      const id = params.getLong("id");
      const data = params.getSFSArray("blocks");
      const blocks = Array(data.size())
         .fill(null)
         .map((_, i) => {
            const payload = data.getSFSObject(i);
            const dataRewards = payload.getSFSArray("rewards");
            const rewards = Array(dataRewards.size())
               .fill(null)
               .map((_, i) => {
                  const payload = dataRewards.getSFSObject(i);

                  return {
                     type: payload.getUtfString("type"),
                     value: payload.getFloat("value"),
                  };
               });

            return {
               hp: payload.getInt("hp"),
               i: payload.getInt("i"),
               j: payload.getInt("j"),
               rewards,
            };
         });

      const result = {
         id: id,
         energy: params.getInt("energy"),
         blocks,
      };

      resolveSerializedPromise(this.controller.startExplode, result);
      this.callHandler(this.handlers.startExplode, result);
   }
   private handleStartStoryExplode(params: SFSObject) {
      const data = params.getSFSArray("blocks");
      const blocks = Array(data.size())
         .fill(null)
         .map((_, i) => {
            const payload = data.getSFSObject(i);
            return {
               i: payload.getInt("i"),
               j: payload.getInt("j"),
            };
         });

      const rawEnemies = params.getSFSArray("enemies");

      const enemies = Array(rawEnemies.size())
         .fill(null)
         .map((_, i) => {
            const enemy = rawEnemies.getSFSObject(i);

            return {
               damage: enemy.getInt("damage"),
               maxHp: enemy.getFloat("maxHp"),
               skin: enemy.getInt("skin"),
               hp: enemy.getFloat("hp"),
               id: enemy.getInt("id"),
               follow: enemy.getBool("follow"),
               bombSkin: enemy.getInt("bombSkin"),
               speed: enemy.getFloat("speed"),
               throughBrick: enemy.getBool("throughBrick"),
            } as IEnemies;
         });
      const result = {
         bombId: params.getLong("bombId"),
         blocks,
         enemies,
      };

      resolveSerializedPromise(this.controller.startStoryExplode, result);
      this.callHandler(this.handlers.startStoryExplode, result);
   }
   private handleEnemyTakeDamage(params: SFSObject) {
      const result = {
         damage: params.getInt("damage"),
         code: params.getInt("code"),
         hp: params.getFloat("hp"),
         id: params.getInt("id"),
      };

      resolveSerializedPromise(this.controller.enemyTakeDamage, result);
      this.callHandler(this.handlers.enemyTakeDamage, result);
   }
   private handleStartExplodeV2(params: SFSObject) {
      const id = params.getLong("id");
      const data = params.getSFSArray("blocks");
      const blocks = Array(data.size())
         .fill(null)
         .map((_, i) => {
            const payload = data.getSFSObject(i);
            const dataRewards = payload.getSFSArray("rewards");
            let rewards: IStartExplodeReward[] = [];
            if (dataRewards) {
               rewards = Array(dataRewards.size())
                  .fill(null)
                  .map((_, i) => {
                     const payloadReward = dataRewards.getSFSObject(i);
                     return {
                        type: payloadReward.getUtfString("type"),
                        value: payloadReward.getFloat("value"),
                     } as IStartExplodeReward;
                  });
            }
            return {
               hp: payload.getInt("hp"),
               i: payload.getInt("i"),
               j: payload.getInt("j"),
               rewards,
            };
         });

      const result = {
         id: id,
         energy: params.getInt("energy"),
         blocks,
      };

      resolveSerializedPromise(this.controller.startExplodeV2, result);
      this.callHandler(this.handlers.startExplodeV2, result);
   }

   private handleStartPVE() {
      resolveUniquePromise(this.controller.startPVE, undefined);
      this.callHandler(this.handlers.startPVE);
   }

   private handleStopPVE() {
      resolveUniquePromise(this.controller.stopPVE, undefined);
      this.callHandler(this.handlers.stopPVE);
   }

   private handleGoSleep(params: SFSObject) {
      const id = params.getLong("id");
      const energy = params.getInt("energy");

      const result = { id, energy };

      resolveSerializedPromise(this.controller.goSleep, result);
      this.callHandler(this.handlers.goSleep, result);
   }

   private handleGoHome(params: SFSObject) {
      const id = params.getLong("id");
      const energy = params.getInt("energy");

      const result = { id, energy };

      resolveSerializedPromise(this.controller.goHome, result);
      this.callHandler(this.handlers.goHome, result);
   }

   private handleGoWork(params: SFSObject) {
      const id = params.getLong("id");
      const energy = params.getInt("energy");

      const result = { id, energy };

      resolveSerializedPromise(this.controller.goWork, result);
      this.callHandler(this.handlers.goWork, result);
   }

   private handleGetReward(params: SFSObject) {
      const rawRewards = params.getSFSArray("rewards");

      const rewards = Array(rawRewards.size())
         .fill(null)
         .map((_, i) => {
            const reward = rawRewards.getSFSObject(i);

            return {
               remainTime: reward.getInt("remain_time"),
               type: parseRewardType(reward.getUtfString("type")),
               value: reward.getFloat("value"),
               claimPending: reward.getDouble("claimPending"),
               network: reward.getUtfString(
                  "data_type"
               ) as IGetRewardPayloadNetwork,
            };
         });

      resolveUniquePromise(this.controller.getReward, rewards);
      this.callHandler(this.handlers.getReward, rewards);
   }

   private handleCoinDetail(params: SFSObject) {
      const detail = {
         mined: params.getFloat("mined"),
         invested: params.getFloat("invested"),
         rewards: params.getFloat("rewards"),
      };

      resolveUniquePromise(this.controller.coinDetail, detail);
      this.callHandler(this.handlers.coinDetail, detail);
   }

   private handleGetStoryDetails(params: SFSObject) {
      const rawRewards = params.getSFSArray("level_rewards");

      const rewards = Array(rawRewards.size())
         .fill(null)
         .map((_, i) => {
            const reward = rawRewards.getSFSObject(i);

            return {
               rare: reward.getInt("rare"),
               replay: reward.getFloat("replay"),
               first_win: reward.getFloat("first_win"),
            };
         });

      const rawPlayedBombers = params.getSFSArray("played_bombers");

      const playedBombers = Array(rawPlayedBombers.size())
         .fill(null)
         .map((_, i) => {
            const playedBomber = rawPlayedBombers.getSFSObject(i);

            return {
               remaining_time: playedBomber.getLong("remaining_time"),
               id: playedBomber.getLong("id"),
            };
         });

      const result = {
         level_rewards: rewards,
         played_bombers: playedBombers,
         is_new: params.getBool("is_new"),
         max_level: params.getInt("max_level"),
         current_level: params.getInt("current_level"),
         hero_id: params.getLong("hero_id"),
      };

      resolveUniquePromise(this.controller.getStoryDetails, result);
      this.callHandler(this.handlers.getStoryDetails, result);
   }

   private handleGetStoryMap(params: SFSObject) {
      const positions = JSON.parse(
         params.getUtfString("positions")
      ) as IGetBlockMapPayload[];

      const rawEnemies = params.getSFSArray("enemies");

      const enemies = Array(rawEnemies.size())
         .fill(null)
         .map((_, i) => {
            const enemy = rawEnemies.getSFSObject(i);

            return {
               damage: enemy.getInt("damage"),
               maxHp: enemy.getFloat("maxHp"),
               skin: enemy.getInt("skin"),
               hp: enemy.getFloat("hp"),
               id: enemy.getInt("id"),
               follow: enemy.getBool("follow"),
               bombSkin: enemy.getInt("bombSkin"),
               speed: enemy.getFloat("speed"),
               throughBrick: enemy.getBool("throughBrick"),
            } as IEnemies;
         });

      const rawHero = params.getSFSObject("hero");

      const hero: IStoryHeroParams = {
         maxHp: rawHero.getInt("maxHp"),
         level: rawHero.getInt("level"),
         stamina: rawHero.getInt("stamina"),
         playercolor: rawHero.getInt("playercolor"),
         active: rawHero.getInt("active"),
         bombSkin: rawHero.getInt("bombSkin"),
         speed: rawHero.getInt("speed"),
         bombDamage: rawHero.getInt("bombDamage"),
         genId: rawHero.getUtfString("genId"),
         abilities: rawHero.getIntArray("abilities"),
         bombRange: rawHero.getInt("bombRange"),
         stage: rawHero.getInt("stage"),
         playerType: rawHero.getInt("playerType"),
         rare: rawHero.getInt("rare"),
         heroType: rawHero.getInt("hero_type"),
         bombNum: rawHero.getInt("bombNum"),
         id: rawHero.getLong("id"),
      };

      const result: IStoryMap = {
         positions,
         enemies,
         col: params.getInt("col"),
         door_x: params.getInt("door_x"),
         level: params.getInt("level"),
         row: params.getInt("row"),
         door_y: params.getInt("door_y"),
         ec: params.getInt("ec"),
         hero,
      } as IStoryMap;
      resolveUniquePromise(this.controller.getStoryMap, result);
      this.callHandler(this.handlers.getStoryMap);
   }

   private handleSyncHouse(params: SFSObject) {
      const data = params.getSFSArray("houses");

      const houses = Array(data.size())
         .fill(null)
         .map((_, i) => {
            const payload = data.getSFSObject(i);
            return {
               house_gen_id: payload.getUtfString("house_gen_id"),
               active: payload.getInt("active"),
            };
         });

      resolveUniquePromise(this.controller.syncHouse, houses);
      this.callHandler(this.handlers.syncHouse, houses);
   }
   private handleApproveClaim(params: SFSObject) {
      const result = {
         amount: params.getDouble("amount"),
         signature: params.getUtfString("signature"),
         tokenType: params.getInt("tokenType"),
         nonce: params.getInt("nonce"),
         details: params.getUtfStringArray("details"),
      };

      resolveUniquePromise(this.controller.approveClaim, result);
      this.callHandler(this.handlers.approveClaim, result);
   }
   private handleConfirmClaimRewardSuccess(params: SFSObject) {
      const result = {
         received: params.getDouble("received"),
      };

      resolveUniquePromise(this.controller.confirmClaimRewardSuccess, result);
      this.callHandler(this.handlers.confirmClaimRewardSuccess, result);
   }
   private handleActiveHouse() {
      resolveUniquePromise(this.controller.activeHouse, undefined);
      this.callHandler(this.handlers.activeHouse);
   }
   private handleActiveBomber() {
      resolveUniquePromise(this.controller.activeBomber, undefined);
      this.callHandler(this.handlers.activeBomber);
   }

   private handleEnterDoor(params: SFSObject) {
      const result = {
         rewards: params.getFloat("rewards"),
      };
      resolveUniquePromise(this.controller.enterDoor, result);
      this.callHandler(this.handlers.enterDoor);
   }

   private handleMessageError(command: EGameAction, errorCode: number) {
      this.callHandler(this.handlers.messageError, command, errorCode);

      const error = makeException(
         "MessageError",
         `Failed with code ${errorCode}`
      );

      switch (command) {
         case "GET_BLOCK_MAP":
            return rejectUniquePromise(this.controller.getBlockMap, error);

         case "SYNC_HOUSE":
            return rejectUniquePromise(this.controller.syncHouse, error);

         case "ACTIVE_HOUSE":
            return rejectUniquePromise(this.controller.activeHouse, error);

         case "GET_ACTIVE_BOMBER":
            return rejectUniquePromise(this.controller.getActiveHeroes, error);
         case "ACTIVE_BOMBER":
            return rejectUniquePromise(this.controller.activeBomber, error);
         case "APPROVE_CLAIM":
            return rejectUniquePromise(this.controller.approveClaim, error);

         case "SYNC_BOMBERMAN":
            return rejectUniquePromise(this.controller.syncBomberman, error);

         case "START_EXPLODE":
            resolveUniquePromise(
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               this.controller.startExplode as any,
               undefined
            );
            break;
         case "START_EXPLODE_V2":
            resolveSerializedPromise(
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               this.controller.startExplodeV2 as any,
               undefined
            );
            this.callHandler(this.handlers.startExplodeV2, undefined as any);
            break;
         case "START_STORY_EXPLODE":
            resolveUniquePromise(this.controller.startStoryExplode, undefined);
            break;
         case "ENEMY_TAKE_DAMAGE":
            resolveUniquePromise(
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               this.controller.enemyTakeDamage as any,
               undefined
            );
            break;

         case "USER_LOGIN":
            return rejectUniquePromise(this.controller.login, error);

         case "START_PVE":
            return rejectUniquePromise(this.controller.startPVE, error);

         case "STOP_PVE":
            return rejectUniquePromise(this.controller.stopPVE, error);

         case "GO_SLEEP":
            return rejectSerializedPromise(this.controller.goSleep, error);

         case "GO_HOME":
            resolveUniquePromise(
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               this.controller.goHome as any,
               undefined
            );
            break;
         // return rejectSerializedPromise(this.controller.goHome, error);

         case "GO_WORK":
            return rejectSerializedPromise(this.controller.goWork, error);

         case "GET_REWARD":
            return rejectUniquePromise(this.controller.getReward, error);

         case "COIN_DETAIL":
            return rejectUniquePromise(this.controller.coinDetail, error);

         case "GET_HERO_UPGRADE_POWER":
            return rejectUniquePromise(
               this.controller.getHeroUpgradePower,
               error
            );

         case "GET_STORY_LEVEL_DETAIL":
            return rejectUniquePromise(this.controller.getStoryDetails, error);

         case "GET_STORY_MAP":
            return rejectUniquePromise(this.controller.getStoryMap, error);

         case "ENTER_DOOR":
            return rejectUniquePromise(this.controller.enterDoor, error);
      }
   }

   private connectEvents() {
      this.sfs.addEventListener(
         SFSEvent.EXTENSION_RESPONSE,
         this.handleExtentionResponse,
         this
      );

      this.sfs.addEventListener(SFSEvent.LOGIN, this.handleLogin, this);
      this.sfs.addEventListener(
         SFSEvent.LOGIN_ERROR,
         this.handleLoginError,
         this
      );
      this.sfs.addEventListener(SFSEvent.LOGOUT, this.handleLogout, this);

      this.sfs.addEventListener(
         SFSEvent.CONNECTION,
         this.handleConnection,
         this
      );
      this.sfs.addEventListener(
         SFSEvent.CONNECTION_LOST,
         this.handleConnectionLost,
         this
      );

      if (askAndParseEnv("DEBUG", parseBoolean, false)) {
         this.sfs.logger.level = LogLevel.DEBUG;
         this.sfs.logger.enableConsoleOutput = true;
         this.sfs.logger.enableEventDispatching = true;

         this.sfs.logger.addEventListener(
            LoggerEvent.INFO,
            logger.info,
            logger
         );
         this.sfs.logger.addEventListener(
            LoggerEvent.ERROR,
            logger.error,
            logger
         );
         this.sfs.logger.addEventListener(
            LoggerEvent.WARNING,
            logger.warning,
            logger
         );
         this.sfs.logger.addEventListener(
            LoggerEvent.DEBUG,
            logger.debug,
            logger
         );
      }
   }

   private handleExtentionResponse(response: IExtensionResponseParams) {
      const params = response.params;

      const ec = params.getInt("ec");
      params.containsKey("ec");
      if (params.containsKey("ec") && ec !== 0) {
         return this.handleMessageError(response.cmd, ec);
      }
      switch (response.cmd) {
         case "GET_BLOCK_MAP":
            return this.handleGetBlockMap(response.params);

         case "SYNC_HOUSE":
            return this.handleSyncHouse(response.params);
         case "ACTIVE_HOUSE":
            return this.handleActiveHouse();
         case "ACTIVE_BOMBER":
            return this.handleActiveBomber();

         case "GET_ACTIVE_BOMBER":
            return this.handleGetActiveHeroes(response.params);
         case "APPROVE_CLAIM":
            return this.handleApproveClaim(response.params);
         case "CONFIRM_CLAIM_REWARD_SUCCESS":
            return this.handleConfirmClaimRewardSuccess(response.params);

         case "SYNC_BOMBERMAN":
            return this.handleSyncBomberman(response.params);

         case "START_EXPLODE":
            return this.handleStartExplode(response.params);

         case "START_EXPLODE_V2":
            return this.handleStartExplodeV2(response.params);
         case "START_STORY_EXPLODE":
            return this.handleStartStoryExplode(response.params);
         case "ENEMY_TAKE_DAMAGE":
            return this.handleEnemyTakeDamage(response.params);

         case "START_PVE":
            return this.handleStartPVE();

         case "STOP_PVE":
            return this.handleStopPVE();

         case "GO_SLEEP":
            return this.handleGoSleep(response.params);

         case "GO_WORK":
            return this.handleGoWork(response.params);

         case "GO_HOME":
            return this.handleGoHome(response.params);

         case "USER_LOGIN":
            return this.handleUserLogin();

         case "GET_REWARD":
            return this.handleGetReward(response.params);

         case "COIN_DETAIL":
            return this.handleCoinDetail(response.params);

         case "GET_HERO_UPGRADE_POWER":
            return this.handleGetHeroUpgradePower();

         case "GET_STORY_LEVEL_DETAIL":
            return this.handleGetStoryDetails(response.params);

         case "GET_STORY_MAP":
            return this.handleGetStoryMap(response.params);

         case "ENTER_DOOR":
            return this.handleEnterDoor(response.params);
      }

      console.warn("Unmapped command: ", response);
   }
}
