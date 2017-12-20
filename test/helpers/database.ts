import { connectDatabase } from "../../src/modules/database/database.providers";
import mongoose = require("mongoose");

export const connect = connectDatabase;
