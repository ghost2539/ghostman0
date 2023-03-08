import { Database } from "./database";

export class Notification {
    db: Database;
    constructor(db: Database) {
        this.db = db;
    }

    setUpdateVersion() {
        return this.db.set("updateVersion", true);
    }
    unsetUpdateVersion() {
        return this.db.set("updateVersion", false);
    }
    async hasUpdateVersion() {
        return (await this.db.get("updateVersion")) == true;
    }
    setHeroShield(heroId: number, shield: number) {
        return this.db.set(`heroShield${heroId}`, shield);
    }
    setMaterial(material: number) {
        return this.db.set(`materialAlert`, material);
    }
    setHeroZeroShield(heroId: number, shield: number) {
        return this.db.set(`heroZeroShield${heroId}`, shield);
    }
    async hasHeroShield(heroId: number) {
        return (await this.db.get(`heroShield${heroId}`)) !== null;
    }
    async hasMaterial() {
        return (await this.db.get(`materialAlert`)) !== null;
    }
    async hasHeroZeroShield(heroId: number) {
        return (await this.db.get(`heroZeroShield${heroId}`)) !== null;
    }
    async checkHeroShield(heroId: number, shield: number) {
        const exists = await this.db.get(`heroShield${heroId}`);
        if (exists !== null && shield > exists) {
            await this.db.delete(`heroShield${heroId}`);
        }
        const existsZero = await this.db.get(`heroZeroShield${heroId}`);
        if (existsZero !== null && shield > 0) {
            await this.db.delete(`heroZeroShield${heroId}`);
        }
    }
    async chetMaterial(material: number) {
        const exists = await this.db.get(`material`);
        if (exists !== null && material > exists) {
            await this.db.delete(`materialAlert`);
        }
    }
}
