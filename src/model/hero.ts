import { IShield } from "../parsers";

export const STATE_ARRAY = ["Work", "Sleep", "Home"] as const;

export type EHeroState = typeof STATE_ARRAY[number] | "Unknown";

export const HERO_RARITY_ARRAY = [
    "Common",
    "Rare",
    "SuperRare",
    "Epic",
    "Legend",
    "SuperLegend",
] as const;

export type EHeroRarity = typeof HERO_RARITY_ARRAY[number] | "Unknown";

export const HERO_SKILL_MAP = {
    1: "ADOnChestExplosion",
    2: "ADOnCageExplosion",
    3: "BlockPiercing",
    4: "EnergyShield",
    5: "Battery",
    6: "WalkThroughBomb",
    7: "WalkThroughBlock",
} as const;

export type EHeroSkill =
    | typeof HERO_SKILL_MAP[keyof typeof HERO_SKILL_MAP]
    | "Unknown";

export const HERO_SKIN_MAP = {
    1: "Frog",
    2: "Knight",
    3: "Cowboy",
    4: "Vampire",
    5: "Witch",
    6: "Doge",
    7: "Pepe",
    8: "Ninja",
} as const;

export type EHeroSkin =
    | typeof HERO_SKIN_MAP[keyof typeof HERO_SKIN_MAP]
    | "Unknown";

export type IHeroStats = {
    index: number;
    rarity: EHeroRarity;
    rarityIndex: number;
    skin: EHeroSkin;
    variant: number;
    stamina: number;
    speed: number;
    strength: number;
    range: number;
    capacity: number;
    level: number;
    bombSkin: number;
    skillCount: number;
    skills: EHeroSkill[];
};
const ROCK_REPAIR_SHIELD: any = {
    1: 1,
    2: 2,
    3: 4,
    4: 6,
    5: 8,
    6: 10,
};
const SHIELD_LEVEL: any = {
    1: {
        1000: 1,
        2000: 2,
        3000: 3,
        4000: 4,
    },
    2: {
        1125: 1,
        2250: 2,
        3375: 3,
        4500: 4,
    },
    3: {
        1250: 1,
        2500: 2,
        3750: 3,
        5000: 4,
    },
    4: {
        1500: 1,
        3000: 2,
        4500: 3,
        6000: 4,
    },
    5: {
        1750: 1,
        3500: 2,
        5250: 3,
        7000: 4,
    },
    6: {
        2000: 1,
        4000: 2,
        6000: 3,
        8000: 4,
    },
};

export type IHeroParams = IHeroStats & {
    id: number;
    state: EHeroState;
    energy: number;
    heroType: number;
    active: boolean;
    shields?: IShield[];
};

export function buildHero(params: IHeroParams) {
    return new Hero(params);
}

export class Hero {
    private params!: IHeroParams;

    get id() {
        return this.params.id;
    }

    get state() {
        return this.params.state;
    }

    get active() {
        return this.params.active;
    }
    get shields() {
        return this.params.shields;
    }
    get heroType() {
        return this.params.heroType;
    }

    get energy() {
        return this.active ? Math.min(this.params.energy, this.maxEnergy) : 0;
    }

    get maxEnergy() {
        return this.stamina * 50;
    }

    get index() {
        return this.params.index;
    }

    get rarityIndex() {
        return this.params.rarityIndex;
    }

    get rarity() {
        return this.params.rarity;
    }

    get skin() {
        return this.params.skin;
    }

    get variant() {
        return this.params.variant;
    }

    get level() {
        return this.params.level;
    }

    get stamina() {
        return this.params.stamina;
    }

    get speed() {
        return this.params.speed;
    }

    get strength() {
        return this.params.strength;
    }

    get damage() {
        return this.strength + Math.max(this.level - 1, 0);
    }

    get range() {
        return this.params.range;
    }

    get capacity() {
        return this.params.capacity;
    }

    get bombSkin() {
        return this.params.bombSkin;
    }
    get skillCount() {
        return this.params.skillCount;
    }

    get skills() {
        return this.params.skills;
    }

    get rockRepairShield() {
        const sumShield =
            this.shields
                ?.map((hero) => hero.total)
                .reduce((p, r) => p + r, 0) || 0;
        const rarity = this.rarityIndex + 1;
        const material = ROCK_REPAIR_SHIELD[rarity];
        const lvlShield = SHIELD_LEVEL[rarity][sumShield];

        return material * lvlShield;
    }

    toJSON() {
        return {
            id: this.id,
            state: this.state,
            active: this.active,
            shields: this.shields,
            heroType: this.heroType,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            index: this.index,
            rarityIndex: this.rarityIndex,
            rarity: this.rarity,
            skin: this.skin,
            variant: this.variant,
            level: this.level,
            stamina: this.stamina,
            speed: this.speed,
            strength: this.strength,
            damage: this.damage,
            range: this.range,
            capacity: this.capacity,
            bombSkin: this.bombSkin,
            skillCount: this.skillCount,
            skills: this.skills,
        };
    }

    constructor(params: IHeroParams) {
        this.update(params);
    }

    update(params: IHeroParams) {
        this.params = params;
    }

    updateEnergy(energy: number) {
        this.params.energy = energy;
    }

    updateShields(shield?: IShield[]) {
        this.params.shields = shield;
    }

    setState(state: EHeroState) {
        this.params.state = state;
    }

    hasSkill(skill: EHeroSkill) {
        return this.skills.indexOf(skill) > -1;
    }

    toString() {
        const skills = this.skills.join("|") || "None";

        return (
            `${this.id} ${this.skin}-${this.variant}-${this.rarity} ` +
            `STA ${this.stamina} SPD ${this.speed} STR ${this.strength} ` +
            `RNG ${this.range} CAP ${this.capacity} BSK ${this.bombSkin} ` +
            `SKC ${this.skillCount} HP ${this.energy} ${skills} ` +
            `${this.state} Level ${this.level}`
        );
    }
}

export type IStoryHeroParams = {
    maxHp: number;
    level: number;
    stamina: number;
    playercolor: number;
    active: number;
    bombSkin: number;
    speed: number;
    bombDamage: number;
    genId: string;
    abilities: number[];
    bombRange: number;
    stage: number;
    playerType: number;
    rare: number;
    id: number;
    bombNum: number;
    heroType: number;
};
