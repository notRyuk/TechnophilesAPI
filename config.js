import { config } from "dotenv";

config()

const DB_URL = process.env.DB_URL.toString() || ""

export {
    DB_URL
}