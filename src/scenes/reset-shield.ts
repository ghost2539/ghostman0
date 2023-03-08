import { Markup, Scenes } from "telegraf";
import { SCENE_RESET_SHIELD } from "./list";
import { sendMessageWithButtonsTelegram } from "../lib";
import { bot } from "..";

const nextStep = (ctx: any, step?: number) => {
    if (ctx.message) {
        ctx.message.text = "";
    }
    if (ctx?.update?.callback_query?.data.length) {
        ctx.update.callback_query.data = "";
    }
    if (!step) {
        ctx.wizard.next();
    } else {
        ctx.wizard.cursor = step;
    }
    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
};
const getValue = (ctx: any) => {
    if (ctx?.update?.callback_query?.data.length) {
        return ctx?.update?.callback_query?.data;
    }

    if (ctx.message?.text) return ctx.message?.text;
    return "";
};

export const sceneResetShield: any = new Scenes.WizardScene(
    SCENE_RESET_SHIELD,
    async (ctx) => nextStep(ctx),
    async (ctx) => {
        try {
            const mode = getValue(ctx);
            if (mode) {
                const hero = mode;
                if (!bot.squad.heroes.find((h) => h.id == hero)) {
                    ctx.replyWithHTML(`Hero not found: ${hero}`);
                    return ctx.scene.leave();
                }

                bot.telegram.telegramResetShield(ctx, hero);

                return ctx.scene.leave();
            }

            await sendMessageWithButtonsTelegram(
                ctx,
                "Select a hero",
                bot.squad.heroes.map((hero) =>
                    Markup.button.callback(
                        hero.id.toString(),
                        hero.id.toString()
                    )
                )
            );
        } catch (e: any) {
            ctx.scene.leave();
            ctx.replyWithHTML("ERROR: \n" + e.message);
        }
    }
);
