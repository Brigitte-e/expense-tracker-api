// @ts-check
import { module } from "@prisma/composer";
import expenseTrackerApiService from "./service.mjs";

export default module("expense-tracker-api", ({ provision }) => {
  provision(expenseTrackerApiService, { id: "expensetrackerapi" });
});
