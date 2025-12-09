import * as schema from "../lib/schema";
import { drizzle } from "@apibara/plugin-drizzle";

export const db = drizzle({
  schema,
});
