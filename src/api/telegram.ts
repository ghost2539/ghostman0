import { differenceInMinutes } from "date-fns";
import { Context, Scenes, session, Telegraf } from "telegraf";
import { TreasureMapBot } from "../bot";
import { BLOCK_REWARD_TYPE_BCOIN_POLYGON } from "../constants";
import { formatDate, getChatId, sleep } from "../lib";
import { logger } from "../logger";
import { Hero } from "../model";
import { isFloat } from "../parsers";
import { SCENE_RESET_SHIELD } from "../scenes/list";
import { sceneResetShield } from "../scenes/reset-shield";

export class Telegram {
    bot;
    telegraf?: Telegraf;
    constructor(bot: TreasureMapBot) {
        this.bot = bot;
    }

    async init() {
        try {
            if (!this.bot.params.telegramKey) return;
            logger.info("Starting telegraf...");
            this.telegraf = new Telegraf(this.bot.params.telegramKey);

            const stage: any = new Scenes.Stage<Scenes.WizardContext>([
                sceneResetShield,
            ]);
            this.telegraf.use(session());
            this.telegraf.use(stage.middleware());

            this.telegraf?.command("stats", (ctx) =>
                this.checkChatId(ctx, () => this.telegramStats(ctx))
            );
            this.telegraf?.command("rewards_all", (ctx) =>
                this.checkChatId(ctx, () => this.telegramRewardsAll(ctx))
            );
            this.telegraf?.command("rewards", (ctx) =>
                this.checkChatId(ctx, () => this.telegramRewards(ctx))
            );
            this.telegraf?.command("exit", (ctx) =>
                this.checkChatId(ctx, () => this.telegramExit(ctx))
            );
            this.telegraf?.command("start", (ctx) =>
                this.checkChatId(ctx, () => this.telegramStart(ctx))
            );
            this.telegraf?.command("start_calc_farm", (ctx) =>
                this.checkChatId(ctx, () => this.telegramStartCalcFarm(ctx))
            );
            this.telegraf?.command("stop_calc_farm", (ctx) =>
                this.checkChatId(ctx, () => this.telegramStopCalcFarm(ctx))
            );
            this.telegraf?.command("current_calc_farm", (ctx) =>
                this.checkChatId(ctx, () =>
                    this.telegramStopCalcFarm(ctx, false)
                )
            );
            this.telegraf?.command("shield", (ctx) =>
                this.checkChatId(ctx, () => this.telegramStatsShield(ctx))
            );
            this.telegraf?.command("test_msg", (ctx) =>
                this.checkChatId(ctx, () => this.telegramTestMsg(ctx))
            );
            this.telegraf?.command("config", (ctx) =>
                this.checkChatId(ctx, () => this.telegramConfig(ctx))
            );
            this.telegraf?.command("withdraw", (ctx) =>
                this.checkChatId(ctx, () => this.telegramWithdraw(ctx))
            );
            this.telegraf?.command("gas_polygon", (ctx) =>
                this.checkChatId(ctx, () => this.telegramAverageGasPolygon(ctx))
            );
            this.telegraf?.command("wallet", (ctx) =>
                this.checkChatId(ctx, () => this.telegramWallet(ctx))
            );
            this.telegraf?.command("pool", (ctx) =>
                this.checkChatId(ctx, () => this.telegramPool(ctx))
            );
            this.telegraf?.command("reset_shield", (ctx: any) =>
                this.checkChatId(ctx, () => ctx.scene.enter(SCENE_RESET_SHIELD))
            );

            const commands = [
                { command: "exit", description: "exit" },
                { command: "start", description: "start" },
                { command: "rewards", description: "rewards" },
                { command: "rewards_all", description: "rewards_all" },
                { command: "shield", description: "shield" },
                { command: "stats", description: "stats" },
                { command: "start_calc_farm", description: "start_calc_farm" },
                { command: "config", description: "config" },
                { command: "stop_calc_farm", description: "stop_calc_farm" },
                {
                    command: "current_calc_farm",
                    description: "current_calc_farm",
                },
                { command: "pool", description: "pool" },
                { command: "test_msg", description: "test_msg" },
                { command: "gas_polygon", description: "gas_polygon" },
                { command: "withdraw", description: "withdraw" },
                { command: "wallet", description: "wallet" },
                { command: "reset_shield", description: "reset_shield" },
            ];
            await this.telegraf.telegram.setMyCommands(commands, {
                language_code: "en",
            });
            await this.telegraf.telegram.setMyCommands(commands, {
                language_code: "pt",
            });
            this.telegraf.launch();

            const intervalStart = setInterval(async () => {
                try {
                    this.telegraf?.stop();
                    setTimeout(() => {
                        this.telegraf?.launch();
                    }, 1000 * 10);
                } catch (e: any) {
                    setTimeout(() => {
                        this.telegraf?.launch();
                    }, 1000 * 10);
                }
            }, 3 * 60 * 1000);

            process.once("SIGINT", () => {
                this.telegraf?.stop("SIGINT");
                clearInterval(intervalStart);
            });
            process.once("SIGTERM", () => {
                this.telegraf?.stop("SIGTERM");
                clearInterval(intervalStart);
            });
        } catch (e) {
            console.log(e);
        }
    }
    checkChatId(context: Context, fn: any) {
        if (this.bot.params.telegramChatId) {
            const chatId = getChatId(context);
            if (
                this.bot.params.telegramChatIdCheck &&
                chatId != this.bot.params.telegramChatId
            ) {
                context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\n🟥 You do not have permission. your Telegram Chat Id is different from what was informed in the settings`
                );
                return;
            }
        }
        return fn(context);
    }
    async telegramConfig(context: Context) {
        const {
            rede,
            alertShield,
            houseHeroes,
            minHeroEnergyPercentage,
            numHeroWork,
            server,
            telegramChatId,
            telegramKey,
            resetShieldAuto,
            ignoreNumHeroWork,
            alertMaterial,
            version,
            maxGasRepairShield,
            reportRewards,
            telegramChatIdCheck,
        } = this.bot.params;

        const { type } = this.bot.loginParams;

        const getbool = (value: boolean) => (value ? "Yes" : "No");

        const html =
            `👤Account: ${this.bot.getIdentify()}\n\n` +
            `:globe_with_meridians:<b>Network</b>: ${rede}\n` +
            `<b>:bellhop_bell: :bellhop:Alert shield</b>: ${alertShield}\n` +
            `<b>:house:Heroes select at home</b>: ${houseHeroes
                .split(":")
                .join(", ")}\n` +
            `<b>:bar_chart:Percentage of hero life to work</b>: ${minHeroEnergyPercentage}%\n` +
            `<b>:crossed_swords:Qty of heroes to work</b>: ${numHeroWork}\n` +
            `<b>:computer:Server</b>: ${server}\n` +
            `<b>Telegram chat ID</b>: ${telegramChatId}\n` +
            `<b>:key:Telegram KEY</b>: ${telegramKey}\n` +
            `<b>Check telegram chat id</b>: ${getbool(telegramChatIdCheck)}\n` +
            `<b>Alert material</b>: ${alertMaterial}\n` +
            `<b>Max gas reset shield</b>: ${maxGasRepairShield || "No"}\n` +
            `<b>Report rewards</b>: ${
                reportRewards ? reportRewards + " min" : "No"
            }\n` +
            `<b>:shield:Auto reset shield</b>: ${getbool(resetShieldAuto)}\n` +
            `<b>Ignore qty hero work</b>: ${getbool(ignoreNumHeroWork)}\n` +
            `<b>Type login</b>: ${type}\n` +
            `<b>Bomb version</b>: ${version}`;

        context.replyWithHTML(html);
    }
    async telegramStats(context: Context) {
        if (!(await this.telegramCheckVersion(context))) return false;

        if (!this.bot.shouldRun) {
            await context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\n🟥 Account not working`
            );
            return;
        }

        const message = await this.getStatsAccount();
        await context.replyWithHTML(message);
    }

    public async getStatsAccount() {
        const formatMsg = (hero: Hero) => {
            const isSelectedAtHome = this.bot.houseHeroes.includes(
                hero.id.toString()
            );
            const shield = hero.shields?.length
                ? `${hero.shields[0].current}/${hero.shields[0].total}`
                : "empty shield";
            if (isSelectedAtHome) {
                return `┣<b>${this.getColor(hero)} [${hero.id}]: ${hero.energy}/${hero.maxEnergy} | ${shield}</b>`;
            } else {
                return `┣${this.getColor(hero)} [${hero.id}]: ${hero.energy}/${hero.maxEnergy} | ${shield}`;
            }
        };

        // const heroesAdventure = await this.getHeroesAdventure();

        const workingHeroesLife = this.bot.workingSelection
            .map(formatMsg)
            .join("\n");
        const notWorkingHeroesLife = this.bot.sleepingSelection
            .map(formatMsg)
            .join("\n");
        const homeHeroesLife = this.bot.homeSelection.map(formatMsg).join("\n");
        let msgEnemies = "\n";

        if (this.bot.playing === "Adventure") {
            const enemies = this.bot.adventureEnemies.filter(
                (e) => e.hp > 0
            ).length;
            const AllEnemies = this.bot.adventureEnemies.length;
            msgEnemies = `Total enemies adventure: ${enemies}/${AllEnemies}\n\n`;
        }
        // const heroesAdventureSelected = this.adventureHeroes.join(", ");
        const houseHeroesIds = this.bot.houseHeroes.join(", ");

        const message =
            `👤Account: ${this.bot.getIdentify()}\n\n` +
            `Playing mode: ${this.bot.getStatusPlaying()}\n\n` +
            // `Adventure heroes: ${heroesAdventure.usedHeroes.length}/${heroesAdventure.allHeroes.length}\n` +
            // `Heroes selected for adventure: ${heroesAdventureSelected}\n` +
            msgEnemies +
            `Network: ${this.bot.client.loginParams.rede}\n` +
            `Treasure/Amazon:\n` +
            `${this.bot.map.toString()}\n` +
            `Heroes selected for home(${this.bot.houseHeroes.length}): ${houseHeroesIds}\n` +
            `Remaining chest (Amazon): \n${this.bot.map
                .formatMsgBlock()
                .join("\n")}\n\n` +
            `INFO: LIFE HERO | SHIELD HERO\n` +
            `Working heroes (${this.bot.workingSelection.length}): \n${workingHeroesLife}\n\n` +
            `Resting heroes (${this.bot.sleepingSelection.length}): \n${notWorkingHeroesLife}\n\n` +
            `Resting heroes at home (${this.bot.homeSelection.length}): \n${homeHeroesLife}`;

        return message;
    }

    getColor({ rarityIndex }: Hero) {
        const types = ["⚪", "🟢", "🔵", "🟣", "🟡", "🔴"];
        return types[rarityIndex];
     }

    public getTotalHeroZeroShield(database: any) {
        return Object.keys(database).filter(
            (v) => v.indexOf("heroZeroShield") !== -1
        ).length;
    }

    async telegramRewardsAll(context: Context) {
        if (!(await this.telegramCheckVersion(context))) return false;

        const resultDb = this.bot.db.getAllDatabase();

        const html = `
<b>Rewards</b>

Bcoin | Bomberman | heroes with zero shield | time last update UTC 0

${resultDb
    .filter((v) => v.rewards)
    .map((account) => {
        const date = new Date(account.rewards.date);
        const username = account.username;
        const zeroShield = this.getTotalHeroZeroShield(account);
        const bcoin = account.rewards.values
            .find(
                (v: any) =>
                    v.network == this.bot.loginParams.rede && v.type == "BCoin"
            )
            ?.value.toFixed(2);

        const bomberman =
            account.rewards.values.find(
                (v: any) =>
                    v.network == this.bot.loginParams.rede &&
                    v.type == "Bomberman"
            )?.value || "0";

        const dateStr = `${date.getHours()}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;

        return `👤<b>${username}</b>:  ${bcoin} | ${bomberman} | ${zeroShield} | ${dateStr}`;
    })
    .join("\n")}`;

        context.replyWithHTML(html);
    }

    async telegramRewards(context: Context) {
        try {
            const material = await this.bot.client.web3GetRock();
            const message = await this.getRewardAccount();
            await context.replyWithHTML(`${message}\nMaterial: ${material}`);
        } catch (e) {
            await context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\n🟥 Not connected, please wait`
            );
        }
    }

    async sendRewardReport(date: number) {
        try {
            const message = await this.getRewardAccount();
            await this.sendMessageChat(message);
            await this.bot.db.set("report", date);
        } catch (e) {
            await this.sendMessageChat(
                `👤Account: ${this.bot.getIdentify()}\n\n🟥 Not connected, please wait`
            );
        }
    }
    public async getRewardAccount() {
        if (this.bot.client.isConnected) {
            const rewards = await this.bot.client.getReward();
            // const detail = await this.client.coinDetail();

            const message =
                "👤Account: " +
                this.bot.getIdentify() +
                "\n\n" +
                "Rewards:\n" +
                // `Mined: ${detail.mined} | Invested: ${detail.invested} ` +
                // `| Rewards: ${detail.rewards}\n` +
                rewards
                    .filter(
                        (v) =>
                            v.network == this.bot.params.rede ||
                            v.network == "TR"
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
            throw new Error("🟥 Not connected, please wait");
        }
    }
    async telegramExit(context: Context) {
        if (this.bot.isResettingShield) {
            await context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\n🟥 It is not possible to finalize at the moment, there is a web3 transaction being executed at the moment`
            );
            return;
        }

        await context.replyWithHTML(
            `👤Account: ${this.bot.getIdentify()}\n\n⏳ Exiting in 10 seconds...`
        );
        await this.bot.sleepAllHeroes();
        this.bot.shouldRun = false;
        await sleep(10000);
        await this.telegraf?.stop("SIGINT");
        await this.bot.db.set("start", false);
        throw new Error("exit");
    }
    async telegramStart(context: Context) {
        await this.bot.db.set("start", true);
        await context.replyWithHTML(
            `👤Account: ${this.bot.getIdentify()}\n\n⏳ starting...`
        );
        await sleep(10000);
        await this.telegraf?.stop("SIGINT");
        throw new Error("exit");
    }
    async telegramStatsShield(context: Context) {
        if (!(await this.telegramCheckVersion(context))) return false;

        if (!this.bot.shouldRun) {
            await context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\n🟥 Account not working`
            );
            return;
        }

        const material = await this.bot.client.web3GetRock();

        const formatMsg = (hero: Hero) => {
            const shield = hero.shields?.length
                ? `${hero.shields[0].current}/${hero.shields[0].total}`
                : "empty shield";
            return `┣${this.getColor(hero)} [${hero.id}]: ${shield} (${hero.rockRepairShield})🪨`;
        };
        let message =
            "🟥 Account not connected, wait the bot will try to connect again";
        const result = this.bot.squad.heroes;

        if (result && result.length) {
            const heroes = result
                .sort((a, b) => {
                    const aShield = a.shields ? a.shields[0]?.current : 0;
                    const bShield = b.shields ? b.shields[0]?.current : 0;

                    return aShield - bShield;
                })
                .map(formatMsg)
                .join("\n");

            message =
                `👤Account: ${this.bot.getIdentify()}\n\n` +
                `🛡️Shield heroes (${result.length}): \n\n${heroes}`;

            if (material !== null) {
                message += `\n\n🪨 Material:${material}`;
            }
        }

        context.replyWithHTML(message);
    }

    async getTotalMap(dateStart: number) {
        const list = (await this.bot.db.get<number[]>("newMap")) || [];

        return list.filter((v) => v >= dateStart).length;
    }

    async telegramStopCalcFarm(context: Context, stop = true) {
        if (!(await this.telegramCheckVersion(context))) return false;

        if (!this.bot.shouldRun || !this.bot.client.isLoggedIn) {
            await context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\n🟥 Account not working`
            );
            return;
        }
        const value = await this.bot.currentCalcFarm();
        if (!value) {
            return context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\n🟥 Farm calculation was not previously started`
            );
        }
        const dateStart = value.start.date;
        const dateEnd = value.current.date;
        const bcoinStart = value.start.bcoin;
        const bcoinEnd = value.current.bcoin;
        const totalBcoin = bcoinEnd - bcoinStart;
        const totalMap = await this.getTotalMap(dateStart);
        const diffmin = differenceInMinutes(dateEnd, dateStart);
        const diffHours = diffmin / 60;

        if (diffmin == 0) {
            return context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\n⏳ wait at least 1 minute`
            );
        }

        if (stop) {
            this.bot.db.set("calcFarm", null);
            this.bot.db.set("newMap", []);
        }

        let totalAverageMap = totalMap / diffmin;
        let totalAverageHour = totalBcoin / diffmin;
        let description =
            `Total minutes: ${diffmin.toFixed(2)}\n` +
            `Average per minute: ${totalAverageHour.toFixed(2)}\n` +
            `Average per day: ${(totalAverageHour * 1440).toFixed(2)}\n` +
            `Average map per minute: ${totalAverageMap.toFixed(2)}`;
        if (diffHours > 1) {
            totalAverageHour = totalBcoin / diffHours;
            totalAverageMap = totalMap / diffHours;
            description =
                `Total hours: ${diffHours.toFixed(2)}\n` +
                `Average per hour: ${totalAverageHour.toFixed(2)}\n` +
                `Average per day: ${(totalAverageHour * 24).toFixed(2)}\n` +
                `Average map per hour: ${totalAverageMap.toFixed(2)}`;
        }

        const html =
            `👤Account: ${this.bot.getIdentify()}\n\n` +
            `Date start: ${formatDate(new Date(dateStart))}\n` +
            `Date end: ${formatDate(new Date(dateEnd))}\n\n` +
            `Bcoin start: ${bcoinStart.toFixed(2)}\n` +
            `Bcoin end: ${bcoinEnd.toFixed(2)}\n\n` +
            `Total bcoin: ${totalBcoin.toFixed(2)}\n` +
            `Total maps: ${totalMap}\n\n` +
            description;

        context.replyWithHTML(html);
    }
    async telegramCheckVersion(context: Context) {
        const existNotification =
            await this.bot.notification.hasUpdateVersion();
        if (existNotification) {
            const message =
                "⚠️ Please update your code version, run yarn start on your computer, and execute in your telegram /start";
            context.replyWithHTML(message);
            return false;
        }
        return true;
    }
    async telegramAverageGasPolygon(context: Context) {
        const result = await this.bot.getAverageWeb3Transaction();
        const html =
            `👤Account: ${this.bot.getIdentify()}\n\n` +
            `The values below are an average of how much it would cost right now\n\n` +
            `Claim: ${result.claim}\n` +
            `Reset Shield: ${result.resetShield}`;

        context.replyWithHTML(html);
    }
    async telegramWallet(context: Context) {
        if (this.bot.loginParams.type == "user") {
            return context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\nFunctionality only allowed when logging in with the wallet`
            );
        }

        const result = await this.bot.getWalletBalance();
        const html =
            `👤Account: ${this.bot.getIdentify()}\n\n` +
            `MATIC: ${result.matic}\n` +
            `USDT: ${result.usdt}\n` +
            `BOMB: ${result.bomb}\n`;

        context.replyWithHTML(html);
    }
    async telegramResetShield(context: any, heroId: number) {
        try {
            const { maxGasRepairShield } = this.bot.params;

            const hero = this.bot.squad.heroes.find((h) => h.id == heroId);
            if (!hero) return;

            if (!this.bot.client.isConnected) {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\n🟥 Account not connected, please wait`
                );
            }

            if (this.bot.isResettingShield) {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nThere is already another hero resetting the shield at the moment`
                );
            }
            if (this.bot.loginParams.type == "user") {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nFunctionality only allowed when logging in with the wallet`
                );
            }

            if (this.bot.loginParams.rede != "POLYGON") {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nFunctionality only allowed for POLYGON`
                );
            }

            const lastTransactionWeb3 = await this.bot.web3Ready();

            if (!lastTransactionWeb3) {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nyou currently have an ongoing transaction in your wallet`
                );
            }

            const currentRock = await this.bot.client.web3GetRock();
            const gas = await this.bot.getAverageWeb3Transaction();

            if (hero.rockRepairShield > currentRock) {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\n🟥 Not enough material, needed ${
                        hero.rockRepairShield
                    }, you have ${currentRock}`
                );
            }

            if (
                maxGasRepairShield > 0 &&
                gas.resetShield > maxGasRepairShield
            ) {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nYou configured to spend a maximum of ${maxGasRepairShield} on the transaction, at the moment ${
                        gas.resetShield
                    } is being charged`
                );
            }

            await this.bot.resetShield(hero);
            await this.bot.client.syncBomberman();
            await sleep(5000);
            await this.bot.client.getActiveHeroes();
        } catch (e: any) {
            context.replyWithHTML(e.message);
        }
    }

    async telegramWithdraw(context: Context) {
        try {
            if (this.bot.loginParams.type == "user") {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nFunctionality only allowed when logging in with the wallet`
                );
            }
            if (this.bot.loginParams.rede != "POLYGON") {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nFunctionality only allowed for POLYGON`
                );
            }

            const lastTransactionWeb3 = await this.bot.web3Ready();

            if (!lastTransactionWeb3) {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nyou currently have an ongoing transaction in your wallet`
                );
            }

            const rewards = await this.bot.getReward();
            const bcoin = rewards.find(
                (v) =>
                    v.network == this.bot.loginParams.rede && v.type == "BCoin"
            );

            if (!bcoin) return;
            if (bcoin.value + bcoin.claimPending < 40) {
                return context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nMinimum amount of 40 bcoin`
                );
            }

            context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\n⏳ Starting withdraw ${
                    bcoin.value + bcoin.claimPending
                }`
            );

            await this.telegramStopCalcFarm(context, true);

            const approve = await this.bot.client.approveClaim(
                BLOCK_REWARD_TYPE_BCOIN_POLYGON
            );
            const result = await this.bot.client.web3ApproveClaim(approve);
            if (result.status) {
                const { received } =
                    await this.bot.client.confirmClaimRewardSuccess(
                        BLOCK_REWARD_TYPE_BCOIN_POLYGON
                    );

                context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nYou withdraw ${received} Bcoin`
                );
                await this.telegramStartCalcFarm(context);
            } else {
                context.replyWithHTML(
                    `👤Account: ${this.bot.getIdentify()}\n\nfailed`
                );
            }
        } catch (e: any) {
            return context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\nError: ${e.message}`
            );
        }
    }
    async telegramTestMsg(context: Context) {
        await context.replyWithHTML(
            'if you receive message below "TESTE", it means that your TELEGRAM_CHAT_ID is working, TELEGRAM_CHAT_ID: ' +
                this.bot.params.telegramChatId
        );

        this.sendMessageChat("TESTE");
    }
    async telegramStartCalcFarm(context: Context) {
        if (!(await this.telegramCheckVersion(context))) return false;

        if (!this.bot.shouldRun || !this.bot.client.isLoggedIn) {
            await context.replyWithHTML(
                `👤Account: ${this.bot.getIdentify()}\n\n🟥 Account not working`
            );
            return;
        }

        const value = await this.bot.startCalcFarm();
        const html =
            `👤Account: ${this.bot.getIdentify()}\n\n` +
            `This command is for you to see a farm calculation from this moment on\n\n` +
            `Date: ${formatDate(new Date(value.date))}\n` +
            `Bcoin: ${value.bcoin.toFixed(2)}\n\n` +
            `to terminate and see the final result, type /stop_calc_farm`;

        context.replyWithHTML(html);
    }
    async sendMessageChat(message: string) {
        if (!this.bot.params.telegramChatId) return;

        return this.telegraf?.telegram.sendMessage(
            this.bot.params.telegramChatId,
            `👤Account: ${this.bot.getIdentify()}\n\n${message}`
        );
    }

    async telegramPool(context: Context) {
        const result = await this.bot.client.poolBomb();
        const html =
           `Account : ${this.bot.getIdentify()}\n\n` +
           `Pool Bomb: ${parseFloat(result).toFixed(2)}`;
  
        context.replyWithHTML(html);
     }
}
