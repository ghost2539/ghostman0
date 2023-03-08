import { TreasureMapBot } from "./bot";
import { VERSION_CODE } from "./constants";
import {
    askAndParseEnv,
    identity,
    parseBoolean,
    parseLogin,
    parseNumber,
    requireAndParseEnv,
} from "./lib";

export let bot: TreasureMapBot;

async function main() {
    const params = requireAndParseEnv("LOGIN", parseLogin);
    const report = askAndParseEnv("REPORT_REWARDS", parseInt, 0);
    bot = new TreasureMapBot(params, {
        telegramKey: askAndParseEnv("TELEGRAM_KEY", identity, ""),
        minHeroEnergyPercentage: parseInt(
            askAndParseEnv("MIN_HERO_ENERGY_PERCENTAGE", identity, "50")
        ),
        modeAmazon: true,
        modeAdventure: askAndParseEnv("MODE_ADVENTURE", parseBoolean, false),
        adventureHeroes: askAndParseEnv("ADVENTURE_HEROES", identity, ""),
        houseHeroes: askAndParseEnv("HOUSE_HEROES", identity, ""),
        saveRewardsCsv: askAndParseEnv("SAVE_REWARDS_CSV", parseBoolean, false),
        ignoreNumHeroWork: askAndParseEnv(
            "IGNORE_NUM_HERO_WORK",
            parseBoolean,
            false
        ),
        resetShieldAuto: askAndParseEnv(
            "RESET_SHIELD_AUTO",
            parseBoolean,
            false
        ),
        rede: askAndParseEnv("NETWORK", identity, "BSC"),
        version: parseInt(
            askAndParseEnv("VERSION", identity, VERSION_CODE.toString())
        ),
        alertShield: parseInt(askAndParseEnv("ALERT_SHIELD", identity, "0")),
        numHeroWork: parseInt(askAndParseEnv("NUM_HERO_WORK", identity, "15")),
        telegramChatId: askAndParseEnv("TELEGRAM_CHAT_ID", identity, ""),
        identify: askAndParseEnv("IDENTIFY", identity, ""),
        telegramChatIdCheck: askAndParseEnv(
            "TELEGRAM_CHAT_ID_CHECK",
            parseBoolean,
            false
        ),
        reportRewards: report,
        server: askAndParseEnv("SERVER", identity, "sea"),
        maxGasRepairShield: askAndParseEnv(
            "MAX_GAS_REPAIR_SHIELD",
            parseNumber,
            0
        ),
        alertMaterial: askAndParseEnv("ALERT_MATERIAL", parseNumber, 0),
    });

    let intervalReport: NodeJS.Timer;

    if (report) {
        intervalReport = setInterval(async () => {
            const start = await bot.db.get("start");
            const lastDate = (await bot.db.get("report")) || 0;
            const now = Date.now();
            const valid = now > lastDate + report * 60 * 1000;

            if ((start || start === null) && valid) {
                bot.telegram.sendRewardReport(now - 1000);
            }
        }, 1000 * 60);
    }

    const exit = async () => {
        await bot.sleepAllHeroes();
        await bot.stop();
        if (intervalReport) clearInterval(intervalReport);

        process.exit();
    };

    process.once("SIGINT", exit);
    process.once("SIGTERM", exit);

    const start = await bot.db.get("start");
    if (start || start === null) {
        await bot.loop();
    }
}
main();
