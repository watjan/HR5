/**
 * Hostinger Production Entrypoint
 * This is a clean direct loader to run the production server.
 */
import("./dist/server.cjs").catch((err) => {
  console.error("Failed to load production server:", err);
});
