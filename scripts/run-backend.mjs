// Starts the Spring Boot backend with Maven.
// Used by `npm run dev:backend` under `neon-env run`, which injects the Neon
// branch's DATABASE_URL / DATABASE_URL_UNPOOLED into this process's environment.
// A shell is needed on Windows because Maven is a .cmd file there.
import { spawn } from "node:child_process";

const child = spawn("mvn", ["-f", "backend/pom.xml", "spring-boot:run"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 1));
