import { ObjectHeaderItem } from "csv-writer/src/lib/record";
import { Client } from "./api";
import {
   CONTRACT_BOMB,
   CONTRACT_MATIC,
   CONTRACT_USDT,
   VERSION_CODE,
} from "./constants";
import config from "./ecosystem.config";
import {
   connectWebSocketAnalytics,
   getFromCsv,
   getGasPolygon,
   getRandomArbitrary,
   sendEventSockect,
   sleep,
   t,
   timedelta,
   writeCsv,
} from "./lib";
import { logger } from "./logger";

import child_process from "child_process";
import pm2 from "pm2";

import { EGameAction } from "./api/base";
import { Database } from "./api/database";
import { Notification } from "./api/notification";
import { Telegram } from "./api/telegram";
import {
   BLOCK_TYPE_MAP,
   buildBlock,
   buildHero,
   buildHouse,
   Hero,
   House,
   IGetBlockMapPayload,
   IHeroUpdateParams,
   IMapTile,
   IMapTileEmpty,
   Squad,
   TreasureMap,
} from "./model";
import {
   IEnemies,
   IEnemyTakeDamagePayload,
   isFloat,
   IStartExplodePayload,
   IStartStoryExplodePayload,
   IStoryMap,
   ISyncBombermanPayload,
   parseGetActiveBomberPayload,
   parseGetBlockMapPayload,
   parseHeroStats,
   parseStartExplodePayload,
   parseSyncHousePayload,
} from "./parsers";
import { ILoginParams } from "./parsers/login";

const DEFAULT_TIMEOUT = 1000 * 60 * 5;
const HISTORY_SIZE = 5;
const ADVENTURE_ENABLED = true;
type ExplosionByHero = Map<
   number,
   {
      timestamp: number;
      tile: IMapTile;
   }
>;
type NotificationShieldHero = Map<
   number,
   {
      timestamp: number;
   }
>;
type LocationByHeroWorking = Map<
   number,
   {
      damage: number;
      tile: IMapTileEmpty;
   }
>;
type HeroBombs = { lastId: number; ids: number[] };

export interface IMoreOptions {
   telegramKey?: string;
   forceExit?: boolean;
   modeAmazon?: boolean;
   modeAdventure?: boolean;
   saveRewardsCsv?: boolean;
   telegramChatIdCheck?: boolean;
   resetShieldAuto?: boolean;
   ignoreNumHeroWork?: boolean;
   reportRewards?: number;
   minHeroEnergyPercentage?: number;
   houseHeroes?: string;
   adventureHeroes?: string;
   rede?: string;
   identify?: string;
   rewardsAllPermission?: string[];
   version?: number;
   maxGasRepairShield?: number;
   alertMaterial?: number;
   workHeroWithShield?: number;
   alertShield?: number;
   numHeroWork?: number;
   ignoreRewardCurrency?: string[];
   telegramChatId?: string;
   server?: string;
}
type Required<T> = {
   [P in keyof T]-?: T[P];
};

export class TreasureMapBot {
   public client!: Client;
   public map!: TreasureMap;
   public squad!: Squad;
   public telegram: Telegram;
   public selection: Hero[];
   public houses: House[];
   public explosionByHero: ExplosionByHero;
   public notificationShieldHero: NotificationShieldHero;
   public locationByHeroWorking: LocationByHeroWorking;
   public heroBombs: Record<number, HeroBombs> = {};
   public history: IMapTile[];
   public index: number;
   public shouldRun: boolean;
   public isFarming: boolean;
   public isCreatingMaterial: boolean;
   public isHeroFarming: boolean;
   public lastAdventure: number;
   public alertShield: number;
   public forceExit = true;
   public minHeroEnergyPercentage;
   public adventureBlocks: IGetBlockMapPayload[] = [];
   public adventureEnemies: IEnemies[] = [];
   public houseHeroes: string[] = [];
   public adventureHeroes: string[] = [];
   public playing: "Adventure" | "Amazon" | "Treasure" | "sleep" | null = null;
   public params: Required<IMoreOptions>;
   public loginParams: ILoginParams;
   public notification: Notification;
   public db: Database;
   public isResettingShield = false;
   public isActivateHero = false;
   public lastTransactionWeb3 = "";

   constructor(
      loginParams: ILoginParams,
      moreParams: IMoreOptions,
      db?: Database
   ) {
      const {
         forceExit = true,
         minHeroEnergyPercentage = 90,
         modeAmazon = false,
         houseHeroes = "",
         adventureHeroes = "",
         modeAdventure = false,
         saveRewardsCsv = false,
         resetShieldAuto = false,
         telegramChatIdCheck = false,
         ignoreNumHeroWork = false,
         reportRewards = 0,
         workHeroWithShield = 0,
         rede = "BSC",
         version = VERSION_CODE,
         alertShield = 0,
         alertMaterial = 0,
         maxGasRepairShield = 0,
         numHeroWork = 15,
         server = "sea",
         telegramChatId = "",
         rewardsAllPermission = [],
         telegramKey = "",
         identify = "",
         ignoreRewardCurrency = [],
      } = moreParams;

      this.params = {
         forceExit,
         minHeroEnergyPercentage,
         modeAmazon: true,
         houseHeroes,
         adventureHeroes,
         modeAdventure,
         saveRewardsCsv,
         rede,
         version,
         alertShield,
         numHeroWork,
         server,
         workHeroWithShield,
         telegramChatId,
         telegramKey,
         telegramChatIdCheck,
         resetShieldAuto,
         rewardsAllPermission,
         maxGasRepairShield,
         ignoreNumHeroWork,
         alertMaterial,
         reportRewards,
         identify,
         ignoreRewardCurrency,
      };
      this.loginParams = loginParams;
      loginParams.rede = rede;
      loginParams.version = version;

      this.playing = null;
      this.client = new Client(
         loginParams,
         DEFAULT_TIMEOUT,
         modeAmazon,
         this.params
      );
      this.map = new TreasureMap({ blocks: [] });
      this.squad = new Squad({ heroes: [] });
      this.houses = [];
      this.forceExit = forceExit || true;
      this.houseHeroes = houseHeroes ? houseHeroes.split(":") : [];
      this.adventureHeroes = adventureHeroes ? adventureHeroes.split(":") : [];
      this.minHeroEnergyPercentage = minHeroEnergyPercentage;

      this.explosionByHero = new Map();
      this.heroBombs = {};
      this.locationByHeroWorking = new Map();
      this.notificationShieldHero = new Map();
      this.selection = [];
      this.history = [];
      this.index = 0;
      this.shouldRun = false;
      this.isCreatingMaterial = false;
      this.isFarming = false;
      this.isHeroFarming = false;
      this.lastAdventure = 0;
      this.alertShield = alertShield;
      if (db) {
         this.db = db;
      } else {
         if ("username" in loginParams) {
            this.db = new Database(loginParams.username || "");
         } else {
            this.db = new Database(loginParams.wallet || "");
         }
      }
      this.notification = new Notification(this.db);
      this.telegram = new Telegram(this);
      this.telegram.init();
   }

   async stop() {
      logger.info("Send sleeping heros...");
      this.shouldRun = false;

      await sleep(5000);

      for (const hero of this.workingSelection) {
         await this.client.goSleep(hero);
      }

      this.telegram?.telegraf?.stop();
   }

   async getCurrentCalcFarm() {
      const rewards = await this.getReward();

      const value = {
         date: new Date().getTime(),
         bcoin:
            rewards.find(
               (r) => r.network == this.params.rede && r.type == "BCoin"
            )?.value || 0,
      };
      return value;
   }

   async startCalcFarm() {
      const value = await this.getCurrentCalcFarm();
      this.db.set("calcFarm", value);
      return value;
   }
   async currentCalcFarm() {
      const start = await this.db.get("calcFarm");
      if (!start) return null;

      const current = await this.getCurrentCalcFarm();

      return {
         current,
         start,
      };
   }

   getStatusPlaying() {
      if (this.playing === "sleep") return "sleep for 10 seconds";
      if (this.playing === null) return "starting";
      return this.playing;
   }

   public async getStatsAccount() {
      const formatMsg = (hero: Hero) => {
         const isSelectedAtHome = this.houseHeroes.includes(hero.id.toString());
         const shield = hero.shields?.length
            ? `${hero.shields[0].current}/${hero.shields[0].total}`
            : "empty shield";
         if (isSelectedAtHome) {
            return `<b>${hero.rarity} [${hero.id}]: ${hero.energy}/${hero.maxEnergy} | ${shield}</b>`;
         } else {
            return `${hero.rarity} [${hero.id}]: ${hero.energy}/${hero.maxEnergy} | ${shield}`;
         }
      };

      const workingHeroesLife = this.workingSelection.map(formatMsg).join("\n");
      const notWorkingHeroesLife = this.sleepingSelection
         .map(formatMsg)
         .join("\n");
      const homeHeroesLife = this.homeSelection.map(formatMsg).join("\n");
      let msgEnemies = "\n";

      if (this.playing === "Adventure") {
         const enemies = this.adventureEnemies.filter((e) => e.hp > 0).length;
         const AllEnemies = this.adventureEnemies.length;
         msgEnemies = `Total enemies adventure: ${enemies}/${AllEnemies}\n\n`;
      }
      const houseHeroesIds = this.houseHeroes.join(", ");

      const message =
         `Account: ${this.getIdentify()}\n\n` +
         `Playing mode: ${this.getStatusPlaying()}\n\n` +
         msgEnemies +
         `Network: ${this.client.loginParams.rede}\n` +
         `Treasure/Amazon:\n` +
         `${this.map.toString()}\n` +
         `Heroes selected for home(${this.houseHeroes.length}): ${houseHeroesIds}\n` +
         `Remaining chest (Amazon): \n${this.map
            .formatMsgBlock()
            .join("\n")}\n\n` +
         `INFO: LIFE HERO | SHIELD HERO\n` +
         `Working heroes (${this.workingSelection.length}): \n${workingHeroesLife}\n\n` +
         `Resting heroes (${this.sleepingSelection.length}): \n${notWorkingHeroesLife}\n\n` +
         `Resting heroes at home (${this.homeSelection.length}): \n${homeHeroesLife}`;

      return message;
   }

   public async getRewardAccount() {
      if (this.client.isConnected) {
         const rewards = await this.client.getReward();
         const message =
            "Account: " +
            this.getIdentify() +
            "\n\n" +
            "Rewards:\n" +
            rewards
               .filter(
                  (v) => v.network == this.params.rede || v.network == "TR"
               )
               .sort((a, b) => (a.network > b.network ? -1 : 1))
               .map(
                  (reward) =>
                     `${reward.network}-${reward.type}: ${
                        isFloat(reward.value)
                           ? reward.value.toFixed(2)
                           : reward.value
                     }`
               )
               .join("\n");

         return message;
      } else {
         throw new Error("Not connected, please wait");
      }
   }

   get workingSelection() {
      return this.selection.filter(
         (hero) => hero.state === "Work" && hero.energy > 0
      );
   }
   get notWorkingSelection() {
      return this.squad.notWorking;
   }
   get sleepingSelection() {
      return this.squad.sleeping;
   }
   get homeSelection() {
      return this.squad.home;
   }

   get home(): House | undefined {
      return this.houses.filter((house) => house.active)[0];
   }

   get homeSlots() {
      return this.home?.slots || 0;
   }

   nextId() {
      return this.index++;
   }

   nextHero() {
      return this.workingSelection[
         this.nextId() % this.workingSelection.length
      ];
   }

   async logIn() {
      if (this.client.isLoggedIn) return;
      logger.info("Logging in...");

      await this.client.connectServer();
      this.reset();
      await this.client.login();
      logger.info("Logged in successfully");
      await this.saveRewards();
   }

   async saveRewards() {
      if (!this.params.saveRewardsCsv) return;
      logger.info("Save rewards in csv...");
      let user = "nameuser";
      if ("username" in this.client.loginParams) {
         user = this.client.loginParams.username;
      } else if ("wallet" in this.client.loginParams) {
         user = this.client.loginParams.wallet;
      }
      const name = `./csv/${user}.csv`;
      const rewards = await this.client.getReward();

      const items = await getFromCsv(name);
      const headers: ObjectHeaderItem[] = [];
      const obj: Record<string, string> = {};

      rewards.map((reward) => {
         const type = reward.type as string;
         obj[type] = reward.value.toString();
         headers.push({ id: type, title: type });
      });

      items.push(obj);

      await writeCsv(name, items, headers);
   }

   async getAverageWeb3Transaction() {
      const gasMatic = await getGasPolygon();

      return {
         claim: 107115 * gasMatic * 0.000000001,
         resetShield: 61983 * gasMatic * 0.000000001,
         mint1:
            376802 * gasMatic * 0.000000001 + 219016 * gasMatic * 0.000000001,
         mint5:
            578116 * gasMatic * 0.000000001 + 181996 * gasMatic * 0.000000001,
         mint10:
            1111150 * gasMatic * 0.000000001 + 181996 * gasMatic * 0.000000001,
         mint15:
            1584771 * gasMatic * 0.000000001 + 181996 * gasMatic * 0.000000001,
      };
   }
   async getWalletBalance() {
      const [bomb, matic, usdt] = await Promise.all([
         this.client.web3Balance(CONTRACT_BOMB),
         this.client.web3Balance(CONTRACT_MATIC),
         this.client.web3Balance(CONTRACT_USDT, "mwei"),
      ]);

      return { bomb, matic, usdt };
   }

   async refreshHeroAtHome() {
      const homeSelection = this.squad.notWorking
         .filter(
            (hero) =>
               !this.params.modeAmazon ||
               (this.params.modeAmazon &&
                  hero.shields &&
                  hero.shields.length &&
                  this.getSumShield(hero))
         )
         .sort(
            (a, b) =>
               +this.houseHeroes.includes(b.id.toString()) -
                  +this.houseHeroes.includes(a.id.toString()) ||
               b.rarityIndex - a.rarityIndex
         )
         .slice(0, this.homeSlots);

      logger.info(`Will send heroes home (${this.homeSlots} slots)`);

      for (const hero of homeSelection) {
         if (hero.state === "Home") continue;

         const atHome = this.squad.byState("Home");

         if (
            this.houseHeroes.includes(hero.id.toString()) ||
            atHome.length < this.homeSlots
         ) {
            if (atHome.length < this.homeSlots) {
               logger.info(`Sending hero ${hero.id} home`);
               await this.client.goHome(hero);
            } else {
               const removeHero = atHome.find(
                  (hero) => !this.houseHeroes.includes(hero.id.toString())
               );

               if (removeHero) {
                  logger.info(`Removing hero ${removeHero.id} from home`);
                  await this.client.goSleep(removeHero);
                  logger.info(`Sending hero ${hero.id} home`);
                  await this.client.goHome(hero);
               }
            }
         }
      }
   }

   getSumShield(hero: Hero) {
      return (
         hero.shields?.map((hero) => hero.current).reduce((p, r) => p + r, 0) ||
         0
      );
   }

   async alertShieldHero(hero: Hero) {
      if (!(await this.notification.hasHeroShield(hero.id))) {
         this.telegram.sendMessageChat(`Hero ${hero.id} needs shield repair`);
         this.notification.setHeroShield(hero.id, this.getSumShield(hero));
      }
      logger.info(`Hero ${hero.id} needs shield repair`);
   }
   async alertMaterial(material: number) {
      if (!(await this.notification.hasMaterial())) {
         this.telegram.sendMessageChat(`You need more material`);
         this.notification.setMaterial(material);
      }
   }
   async alertShielZerodHero(hero: Hero) {
      if (!(await this.notification.hasHeroZeroShield(hero.id))) {
         this.telegram.sendMessageChat(`Hero ${hero.id} has 0 shield`);
         this.notification.setHeroZeroShield(hero.id, 0);
      }
   }

   async toWork(hero: Hero) {
      logger.info(`Sending hero ${hero.id} to work`);
      await this.client.goWork(hero);
      this.selection.push(hero);
   }

   async refreshHeroSelection() {
      logger.info("Refreshing heroes");
      await this.client.syncBomberman();
      const { ignoreNumHeroWork, numHeroWork, workHeroWithShield } =
         this.params;

      this.selection = this.squad.byState("Work");
      const heroes = this.squad.notWorking.sort((a, b) => {
         const apercent = (a.energy / a.maxEnergy) * 100;
         const bpercent = (b.energy / b.maxEnergy) * 100;

         return bpercent - apercent || b.rarityIndex - a.rarityIndex;
      });
      for (const hero of heroes) {
         await sleep(500);
         const percent = (hero.energy / hero.maxEnergy) * 100;

         if (
            !hero.shields ||
            hero.shields.length === 0 ||
            this.getSumShield(hero) <= 0
         ) {
            continue;
         }

         if (
            workHeroWithShield > 0 &&
            this.getSumShield(hero) <= workHeroWithShield &&
            hero.energy >= 50
         ) {
            this.toWork(hero);
            continue;
         }

         if (percent < this.minHeroEnergyPercentage) continue;

         if (
            this.workingSelection.length <= numHeroWork - 1 ||
            (ignoreNumHeroWork && percent >= 100)
         ) {
            this.toWork(hero);
         }
      }

      logger.info(`Sent ${this.selection.length} heroes to work`);

      await this.refreshHeroAtHome();
   }

   async getReward() {
      const result = await this.client.getReward();

      this.db.set("rewards", {
         values: result,
         date: new Date().getTime(),
      });

      return result;
   }

   async refreshMap() {
      logger.info(`Refreshing map...`);
      if (this.map.totalLife <= 0) {
         this.resetState();
         logger.info(JSON.stringify(await this.getReward()));
      }
      await this.client.getBlockMap();
      logger.info(`Current map state: ${this.map.toString()}`);
   }

   nextLocation(hero: Hero) {
      //verifica se ele ja esta jogando a bomba em um local.
      const result = this.locationByHeroWorking.get(hero.id);
      const location = this.map
         .getHeroDamageForMap(hero)
         .find(
            ({ tile }) => tile.i == result?.tile.i && tile.j == result?.tile.j
         );

      if (result && location && location.damage > 0) {
         return result;
      }
      const locations = this.map
         .getHeroDamageForMap(hero)
         .filter(({ damage }) => damage > 0);

      let selected;

      if (locations.length <= HISTORY_SIZE) {
         selected = locations[0];
      } else {
         const items = locations.filter(
            ({ tile: option }) =>
               !this.history.find(
                  (tile) => tile.i === option.i && tile.j === option.j
               )
         );
         selected = items[0];
      }
      if (!selected) {
         selected = locations[0];
      }

      this.locationByHeroWorking.set(hero.id, selected);
      return selected;
   }

   tete(hero: Hero, location: IMapTile) {
      const entry = this.explosionByHero.get(hero.id);
      if (!entry) return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const distance =
         Math.abs(location.i - entry.tile.i) +
         Math.abs(location.j - entry.tile.j);

      const elapsed = Date.now() - entry.timestamp;
      const bombs = this.heroBombs[hero.id]?.ids.length || 0;
      return elapsed >= timedelta(distance, hero) && bombs < hero.capacity;
   }

   removeBombHero(hero: Hero, bombId: number) {
      if (!(hero.id in this.heroBombs)) {
         this.heroBombs[hero.id] = { ids: [], lastId: 0 };
      }

      const bombsByHero = this.heroBombs[hero.id];

      this.heroBombs[hero.id].ids = bombsByHero.ids.filter((b) => b !== bombId);
   }

   addBombHero(hero: Hero) {
      if (!(hero.id in this.heroBombs)) {
         this.heroBombs[hero.id] = { ids: [], lastId: 0 };
      }

      const bombsByHero = this.heroBombs[hero.id];

      bombsByHero.lastId++;

      if (bombsByHero.lastId > hero.capacity) {
         bombsByHero.lastId = 1;
      }

      bombsByHero.ids.push(bombsByHero.lastId);
      return bombsByHero;
   }

   async placeBomb(hero: Hero, location: IMapTile) {
      const bombIdObj = this.addBombHero(hero);
      this.locationByHeroWorking.delete(hero.id);
      this.explosionByHero.set(hero.id, {
         timestamp: Date.now(),
         tile: location,
      });

      this.nextLocation(hero);
      if (!bombIdObj) {
         return false;
      }

      const bombId = bombIdObj.lastId;
      //seeta quantas bombas esta jogando ao mesmo tempo

      this.history.push(location);

      logger.info(
         `${hero.rarity} ${hero.id} ${hero.energy}/${hero.maxEnergy} will place ` +
            `bomb on (${location.i}, ${location.j})`
      );
      const result = await this.client.startExplodeV2({
         heroId: hero.id,
         bombId,
         hero_type: hero.heroType,
         blocks: [],
         i: location.i,
         j: location.j,
      });

      this.removeBombHero(hero, bombId);

      if (!result) {
         return false;
      }

      const { energy } = result;

      while (this.history.length > HISTORY_SIZE) this.history.shift();

      if (energy <= 0) {
         logger.info(`Sending hero ${hero.id} to sleep`);
         await this.client.goSleep(hero);
         await this.refreshHeroSelection();
         await this.refreshHeroAtHome();
      }
   }

   async placeBombsHero(hero: Hero) {
      const location = this.nextLocation(hero);

      if (location && this.tete(hero, location.tile)) {
         await this.placeBomb(hero, location.tile);
      }
   }

   async placeBombs() {
      const running: Record<number, Hero> = {};
      const promises = [];

      while (
         this.map.totalLife > 0 &&
         this.workingSelection.length > 0 &&
         this.shouldRun &&
         this.isFarming
      ) {
         this.isHeroFarming = true;
         for (const hero of this.workingSelection) {
            await sleep(70);

            running[hero.id] = hero;
            const promise = this.placeBombsHero(hero).catch((e) => {
               throw e;
            });
            promises.push(promise);
         }
      }

      await Promise.all(promises);
      this.isHeroFarming = false;
   }

   async getHeroesAdventure() {
      const [allHeroes, details] = await Promise.all([
         this.client.syncBomberman(),
         this.client.getStoryDetails(),
      ]);

      const usedHeroes = details.played_bombers.map((hero) => hero.id);

      return {
         allHeroes,
         usedHeroes,
      };
   }

   async getHeroAdventure(allHeroes: ISyncBombermanPayload[]) {
      const details = await this.client.getStoryDetails();
      const usedHeroes = details.played_bombers.map((hero) => hero.id);
      const hero = allHeroes.find(
         (hero) =>
            !usedHeroes.includes(hero.id) &&
            (this.adventureHeroes.length == 0 ||
               this.adventureHeroes.includes(hero.id.toString()))
      );

      if (!hero) {
         return null;
      }
      return buildHero({
         id: hero.id,
         energy: hero.energy,
         active: true,
         heroType: hero.heroType,
         state: "Sleep",
         ...parseHeroStats(hero.gen_id),
      });
   }

   getBlockAdventure() {
      const items = this.adventureBlocks;
      return items[Math.floor(Math.random() * items.length)];
   }
   getEnemyAdventure() {
      const items = this.adventureEnemies.filter((enemy) => enemy.hp > 0);
      return items[Math.floor(Math.random() * items.length)];
   }
   getRandomPosition(
      hero: Hero,
      map: IStoryMap,
      retry = 0
   ): { i: number; j: number } {
      retry = retry + 1;
      const i = Math.ceil(getRandomArbitrary(0, 28));
      const j = Math.ceil(getRandomArbitrary(0, 10));

      const doorI = map.door_x;
      const doorJ = map.door_y;

      const checkPosition = (i: number, j: number) => {
         return (
            (doorI < i - hero.range || doorI > i + hero.range) &&
            (doorJ < j - hero.range || doorJ > j + hero.range)
         );
      };

      if (checkPosition(i, j)) {
         return { i, j };
      }

      if (retry >= 100) {
         const retryPositions = [
            { i: 0, j: 0 },
            { i: 0, j: 10 },
            { i: 28, j: 0 },
            { i: 28, j: 10 },
         ];
         for (const position of retryPositions) {
            if (checkPosition(position.i, position.j)) {
               return position;
            }
         }

         return { i, j };
      }

      return this.getRandomPosition(hero, map, retry);
   }

   async placebombAdventure(
      hero: Hero,
      block: IGetBlockMapPayload | { i: number; j: number },
      map: IStoryMap,
      enemy?: IEnemies
   ) {
      const blockParse = block ? block : this.getRandomPosition(hero, map, 0);

      logger.info(
         `[${hero.rarity}] damage: ${hero.damage} ${hero.id} will place bomb on (${blockParse.i}, ${blockParse.j})`
      );
      const startExplode = this.client.startStoryExplode({
         heroId: hero.id,
         hero_type: hero.heroType,
         i: blockParse.i,
         j: blockParse.j,
         blocks: [],
         bombId: 0,
         isHero: true,
      });

      if (enemy) {
         const totalEnemies = this.adventureEnemies.filter(
            (enemy) => enemy.hp > 0
         );
         logger.info(
            `${hero.id} will place bomb in enemy ${enemy.id} ${enemy.hp}/${enemy.maxHp} totalEnemies ${totalEnemies.length}`
         );
         const enemyTakeDamage = this.client.enemyTakeDamage({
            enemyId: enemy.id,
            heroId: hero.id,
         });
         return await Promise.all([startExplode, enemyTakeDamage]);
      }

      return await startExplode;
   }

   async placeBombsAdventure(hero: Hero, map: IStoryMap) {
      let enemy;
      while ((enemy = this.getEnemyAdventure()) && this.shouldRun) {
         const block = this.getBlockAdventure();

         await this.placebombAdventure(hero, block, map, enemy);

         await sleep(getRandomArbitrary(4, 9) * 1000);
      }
      return true;
   }

   async adventure() {
      if (!ADVENTURE_ENABLED) return null;
      const allHeroes = await this.client.syncBomberman();

      if (allHeroes.length < 15) return null;

      const rewards = await this.client.getReward();
      const keys = rewards.filter((reward) => reward.type === "Key")[0];

      logger.info(`Adventure mode iteration`);

      if (!keys || keys.value === 0) {
         logger.info(`No keys to play right now.`);
         return;
      }
      logger.info(`${keys.value} keys mode adventure`);

      const details = await this.client.getStoryDetails();
      const hero = await this.getHeroAdventure(allHeroes);
      if (hero) {
         const level = Math.min(details.max_level + 1, 45);

         logger.info(`Will play level ${level} with hero ${hero.id}`);

         const result = await this.client.getStoryMap(hero.id, level);
         this.adventureBlocks = result.positions;
         this.adventureEnemies = result.enemies;
         logger.info(`Total enemies: ${this.adventureEnemies.length}`);

         await this.placeBombsAdventure(hero, result);
         logger.info(
            `Place bomb in door x:${result.door_x} y:${result.door_y}`
         );
         await this.placebombAdventure(
            hero,
            {
               i: result.door_x,
               j: result.door_y,
            },
            result
         ); //placebomb door

         logger.info(
            `total enemies after door: ${
               this.adventureEnemies.filter((enemy) => enemy.hp > 0).length
            }`
         );
         await this.placeBombsAdventure(hero, result); //verifica se tem mais enimies

         if (!this.shouldRun) return false;
         logger.info(`Enter door adventure mode`);
         const resultDoor = await this.client.enterDoor();

         logger.info(`Finished Adventure mode ${resultDoor.rewards} Bcoin`);
      } else {
         logger.info(`No hero Adventure mode`);
      }
   }

   async loadHouses() {
      const payloads = await this.client.syncHouse();
      this.houses = payloads.map(parseSyncHousePayload).map(buildHouse);
      if (this.houses.length) {
         const isActive = this.home;
         const [house] = this.houses
            .sort((a, b) => b.slots - a.slots)
            .slice(0, 1);

         if (!isActive || isActive.slots < house.slots) {
            logger.info(`Activing house (${house.slots}) slots`);
            await this.client.activeHouse(house.id);

            const result = await this.client.syncHouse();
            this.houses = result.map(parseSyncHousePayload).map(buildHouse);
         }
      }
   }

   async sleepAllHeroes() {
      logger.info("Sleep all heroes...");
      for (const hero of this.workingSelection) {
         await this.client.goSleep(hero);
      }
   }

   getIdentify() {
      if (this.params.identify) return this.params.identify;

      return "username" in this.loginParams
         ? this.loginParams.username
         : this.loginParams.wallet;
   }

   sendPing() {
      setInterval(() => this.client.ping(), 1000 * 10);
   }
   async registerNewMap() {
      try {
         const list = (await this.db.get<number[]>("newMap")) || [];
         list.push(new Date().getTime());
         this.db.set("newMap", list);
         /* eslint no-empty: ["error", { "allowEmptyCatch": true }] */
      } catch (_: any) {}
   }

   async awaitHeroFarm() {
      return new Promise((resolve) => {
         const interval = setInterval(() => {
            if (!this.isHeroFarming) {
               resolve(true);
               clearInterval(interval);
            }
         }, 1000);
      });
   }

   async checkShields() {
      if (!this.shouldRun) return;

      logger.info(`Cheking shields...`);
      const heroes = this.squad.activeHeroes.filter(
         (hero) =>
            !hero.shields ||
            hero.shields.length === 0 ||
            this.getSumShield(hero) === 0
      );
      let shieldRepaired = false;

      if (!this.params.resetShieldAuto) return false;

      for (const hero of heroes) {
         const lastReset = await this.db.get(`lastResetShield/${hero.id}`);

         if (
            lastReset === null ||
            Date.now() > lastReset + 6 + 60 * 60 * 1000 //6hrs
         ) {
            await this.resetShield(hero);
            shieldRepaired = true;
         }
      }

      if (shieldRepaired) {
         this.setIsFarmTrue();
      }
   }

   async loop() {
      logger.info("Starting bot...");
      this.shouldRun = true;
      this.isFarming = true;
      connectWebSocketAnalytics(this).catch((e) => {
         console.log(e);
      });
      await this.db.set("username", this.getIdentify());
      await this.checkVersion();
      await this.logIn();
      this.sendPing();
      await this.loadHouses();
      await this.refreshMap();

      logger.info("Opening map...");
      this.playing = this.params.modeAmazon ? "Amazon" : "Treasure";
      await this.client.startPVE(0, this.params.modeAmazon);
      do {
         this.playing = "Amazon";
         await this.checkVersion();

         if (this.map.totalLife <= 0) {
            await this.loadHouses();
            await this.refreshMap();
            this.registerNewMap();
         }

         await this.refreshHeroSelection();
         await this.placeBombs();

         logger.info("There are no heroes to work now.");

         this.playing = "sleep";
         await this.checkShields();
         logger.info("Will sleep for 10 seconds");
         await sleep(10 * 1000);
      } while (this.shouldRun);

      await this.sleepAllHeroes();
      await this.refreshHeroAtHome();
      logger.info("Closing map...");
      await this.client.stopPVE();
   }

   async web3Ready() {
      if (this.lastTransactionWeb3) {
         return this.client.checkTransaction(this.lastTransactionWeb3);
      }
      return true;
   }

   async syncBomberman() {
      const heroesParse = await this.client.syncBomberman();
      return heroesParse.map(parseGetActiveBomberPayload).map(buildHero);
   }

   setIsFarmTrue() {
      if (
         !this.isResettingShield &&
         !this.isActivateHero &&
         !this.isCreatingMaterial
      ) {
         this.isFarming = true;
      }
   }

   async createMaterial(heroIds: number[]) {
      try {
         const lastTransactionWeb3 = await this.web3Ready();

         if (
            this.loginParams.type == "user" ||
            this.loginParams.rede == "BSC" ||
            !this.shouldRun ||
            !lastTransactionWeb3
         ) {
            return false;
         }

         this.isFarming = false;
         this.isCreatingMaterial = true;
         if (this.isHeroFarming) {
            logger.info(`Waiting for the heroes to finish farming`);
            await this.telegram.sendMessageChat(
               `Waiting for the heroes to finish farming`
            );
         }

         await this.awaitHeroFarm();

         await this.telegram.sendMessageChat(
            `Creating material with heroes: ${heroIds.join(", ")}`
         );
         logger.info(`Creating material with heroes: ${heroIds.join(", ")}`);

         const transaction = await this.client.web3CreateRock(heroIds);

         this.lastTransactionWeb3 = transaction.transactionHash;
         await sleep(1000);

         await sleep(2000);
         const material = await this.client.web3GetRock();
         await this.client.syncBomberman();
         await this.telegram.sendMessageChat(
            `You have ${material} of material`
         );
         logger.info(`You have ${material} of material`);

         this.isCreatingMaterial = false;
         this.setIsFarmTrue();
      } catch (e: any) {
         this.isCreatingMaterial = false;
         this.setIsFarmTrue();
         this.telegram.sendMessageChat(`Error create material\n\n${e.message}`);
      }
   }

   async resetShield(hero: Hero) {
      try {
         const { maxGasRepairShield, alertMaterial } = this.params;
         const lastTransactionWeb3 = await this.web3Ready();

         if (
            this.isResettingShield ||
            this.loginParams.type == "user" ||
            this.loginParams.rede == "BSC" ||
            !this.shouldRun ||
            !lastTransactionWeb3
         ) {
            return false;
         }

         let currentRock = await this.client.web3GetRock();
         const gas = await this.getAverageWeb3Transaction();

         if (alertMaterial > 0 && currentRock <= alertMaterial) {
            this.alertMaterial(currentRock);
         }
         if (
            hero.rockRepairShield > currentRock ||
            (maxGasRepairShield > 0 && gas.resetShield > maxGasRepairShield)
         ) {
            logger.info(`current gas reset shield: ${gas.resetShield}`);
            logger.info(
               `you have material: ${currentRock}, hero: ${hero.rockRepairShield}`
            );
            return;
         }

         this.isFarming = false;
         this.isResettingShield = true;

         if (this.isHeroFarming) {
            logger.info(`Waiting for the heroes to finish farming`);
            await this.telegram.sendMessageChat(
               `Waiting for the heroes to finish farming`
            );
         }

         await this.awaitHeroFarm();

         await this.telegram.sendMessageChat(
            `Repairing shield hero ${hero.id}...`
         );
         const transaction = await this.client.web3ResetShield(hero);
         this.lastTransactionWeb3 = transaction.transactionHash;
         await sleep(1000);
         currentRock = await this.client.web3GetRock();

         this.db.set(`lastResetShield/${hero.id}`, Date.now());

         const heroes = await this.syncBomberman();
         const heroUpdated = heroes.find((h) => h.id == hero.id);
         if (heroUpdated) {
            this.squad.updateHeroShield(heroUpdated);
         }

         await this.telegram.sendMessageChat(
            `Hero ${hero.id} shield has been repaired\n\nYou have ${currentRock} of material`
         );
         this.isResettingShield = false;
      } catch (e: any) {
         this.isResettingShield = false;
         this.telegram.sendMessageChat(`Error repair shield\n\n${e.message}`);
      }
   }

   private resetState() {
      this.history = [];
      this.explosionByHero = new Map();
      this.heroBombs = {};
      this.locationByHeroWorking = new Map();
      this.selection = [];
      this.index = 0;
   }
   private resetStateAdventure() {
      this.adventureBlocks = [];
      this.adventureEnemies = [];
   }

   reset() {
      this.client.wipe();

      this.client.on({
         event: "getBlockMap",
         handler: this.handleMapLoad.bind(this),
      });

      // this.client.on({
      //     event: "getActiveBomber",
      //     handler: this.handleSquadLoad.bind(this),
      // });
      this.client.on({
         event: "syncBomberman",
         handler: this.handleSquadLoad.bind(this),
      });

      this.client.on({
         event: "goSleep",
         handler: this.handleHeroSleep.bind(this),
      });

      this.client.on({
         event: "goHome",
         handler: this.handleHeroHome.bind(this),
      });

      this.client.on({
         event: "goWork",
         handler: this.handleHeroWork.bind(this),
      });

      this.client.on({
         event: "startExplode",
         handler: this.handleExplosion.bind(this),
      });
      this.client.on({
         event: "startExplodeV2",
         handler: this.handleExplosion.bind(this),
      });
      this.client.on({
         event: "startStoryExplode",
         handler: this.handleStartStoryExplode.bind(this),
      });
      this.client.on({
         event: "enemyTakeDamage",
         handler: this.handleEnemyTakeDamage.bind(this),
      });
      this.client.on({
         event: "messageError",
         handler: this.handleMessageError.bind(this),
      });

      this.resetState();
   }

   private handleMapLoad(payload: IGetBlockMapPayload[]) {
      const blocks = payload.map(parseGetBlockMapPayload).map(buildBlock);

      this.map.update({ blocks });
   }

   private handleSquadLoad(payload: ISyncBombermanPayload[]) {
      const heroes = payload.map(parseGetActiveBomberPayload).map(buildHero);

      heroes
         .filter((h) => h.active)
         .map(async (hero) => {
            if (
               this.params.modeAmazon &&
               (!hero.shields ||
                  hero.shields.length === 0 ||
                  this.getSumShield(hero) <= this.alertShield)
            ) {
               const lastDate = this.notificationShieldHero.get(
                  hero.id
               )?.timestamp;
               //verifica se faz mais que 24 horas da ultima notificação
               if (
                  !lastDate ||
                  (lastDate &&
                     Math.abs(
                        new Date(lastDate).getTime() - new Date().getTime()
                     ) / 36e5) > 24
               ) {
                  await this.alertShieldHero(hero);
                  this.notificationShieldHero.set(hero.id, {
                     timestamp: new Date().getTime(),
                  });
               }
               if (
                  !hero.shields ||
                  hero.shields.length === 0 ||
                  this.getSumShield(hero) === 0
               ) {
                  await this.alertShielZerodHero(hero);
               }
            }
            await this.notification.checkHeroShield(
               hero.id,
               this.getSumShield(hero)
            );
         });
      this.squad.update({ heroes });
   }

   private handleHeroSleep(params: IHeroUpdateParams) {
      this.squad.updateHeroEnergy(params);
      this.squad.updateHeroState(params.id, "Sleep");
   }

   private handleHeroHome(params: IHeroUpdateParams) {
      this.squad.updateHeroEnergy(params);
      this.squad.updateHeroState(params.id, "Home");
   }

   private handleHeroWork(params: IHeroUpdateParams) {
      this.squad.updateHeroEnergy(params);
      this.squad.updateHeroState(params.id, "Work");
   }

   notificationBlockCage() {
      this.telegram.sendMessageChat("You won a hero");
   }

   private handleExplosion(payload: IStartExplodePayload) {
      if (!payload) return;

      const [mapParams, heroParams] = parseStartExplodePayload(payload);
      this.squad.updateHeroEnergy(heroParams);

      for (const block of mapParams) {
         const blockType = this.map.params.blocks.find(
            (b) => b.i == block.i && b.j == block.j
         );
         if (blockType?.type === BLOCK_TYPE_MAP[2] && block.hp === 0) {
            this.notificationBlockCage();
         }
         if (block.rewards?.length) {
            const heroes = this.squad.getTotalHeroes();
            const houseSlots = this.homeSlots;

            block.rewards.map((reward) => {
               sendEventSockect("explosion-rewards", {
                  reward,
                  heroes,
                  houseSlots,
                  minHeroEnergyPercentage: this.params.minHeroEnergyPercentage,
                  numHeroWork: this.params.numHeroWork,
               });
            });
         }
      }
      mapParams.forEach((params) => this.map.updateBlock(params));
   }
   private handleStartStoryExplode(payload: IStartStoryExplodePayload) {
      if (payload.blocks.length) {
         //remove blocks from this.adventureblocks
         payload.blocks.forEach((block) => {
            this.adventureBlocks = this.adventureBlocks.filter(
               (b) => b.i !== block.i || b.j !== block.j
            );
         });
      }
      if (payload.enemies && payload.enemies.length) {
         logger.info(`add enemies ${payload.enemies.length}`);
         payload.enemies.forEach((enemy) => {
            this.adventureEnemies.push(enemy);
         });
      }
   }
   private handleEnemyTakeDamage(payload: IEnemyTakeDamagePayload) {
      const enemy = this.adventureEnemies.find(
         (enemy) => enemy.id == payload.id
      );
      if (enemy) {
         enemy.hp = payload.hp;
      }
   }
   private handleMessageError(command: EGameAction, errorCode: number) {
      if (
         ![
            "ENEMY_TAKE_DAMAGE",
            "START_EXPLODE",
            "START_EXPLODE_V2",
            "GO_HOME",
            "START_STORY_EXPLODE",
         ].includes(command)
      ) {
         this.telegram.sendMessageChat(`Error: ${command} ${errorCode}`);
      }
   }

   async checkVersion() {
      logger.info("Checking version...");

      child_process.execSync(`git config --global user.name "teste"`);
      child_process.execSync(
         `git config --global user.email "teste@teste.com"`
      );
      child_process.execSync(`git config --global pull.rebase false`);

      const result = child_process.execSync(`git pull`).toString();
      const isUpdated = !result.includes("Already up to date.\n");
      if (isUpdated) {
         logger.info("updating version...");
         child_process.execSync(`yarn build`);
         pm2.connect(() => {
            config.apps.map((app) => {
               logger.info(`Starting pm2 ${app.name}`);
               pm2.start(app as any, (e) => {
                  console.log(e);
               });
            });
         });
      }
   }
}
export const time = t("KGRpc3RhbmNlIC8gaGVyby5zcGVlZCkgKiAxMjUw");
