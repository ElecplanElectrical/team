/**
 * Production-safe seed entry point.
 *
 * Historical demo records were removed because they contained realistic
 * customer and employee details. Use `npm run db:seed:owner` when a new
 * platform-owner setup link is required.
 */
async function main() {
  console.log("No sample business data is seeded. Use npm run db:seed:owner for owner access.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
