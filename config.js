import { config } from "dotenv";

config()

const DB_URL = process.env.DB_URL.toString() || ""
const PORT = process.env.PORT || 6969

export {
    DB_URL,
    PORT
}