import { readdirSync, readFileSync } from "fs";
import { Config, JsonDB } from "node-json-db";

export class Database {
    identify: string;
    db: JsonDB;
    constructor(wallet: string) {
        this.identify = wallet;
        this.db = new JsonDB(
            new Config(`database-${this.identify}.json`, true, false, "/")
        );
    }

    getAllDatabase() {
        const files = readdirSync(".").filter((fn) =>
            fn.startsWith("database-")
        );

        return files.map((file) =>
            JSON.parse(readFileSync(file, { encoding: "utf8", flag: "r" }))
        );
    }

    public set(name: string, value: any) {
        return this.db.push(`/${name}`, value);
    }
    public async get<T = any>(name: string): Promise<T | null> {
        try {
            return (await this.db.getData(`/${name}`)) as T;
        } catch (e: any) {
            return null;
        }
    }
    public async delete(name: string) {
        try {
            return await this.db.delete(`/${name}`);
        } catch (e: any) {
            return null;
        }
    }
}
