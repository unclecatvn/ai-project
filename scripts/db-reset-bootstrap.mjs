import { spawn } from "node:child_process";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: false,
    });

    let stderr = "";
    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(chunk);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      const error = new Error(`${command} exited with code ${code}`);
      error.stderr = stderr;
      reject(error);
    });
  });
}

async function main() {
  console.log("Resetting DB and applying migrations...");
  console.log("Trying local reset first (requires Docker).");

  try {
    await run("npx", ["supabase", "db", "reset"]);
    console.log("Done. Fresh local schema is ready.");
    return;
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error
      ? String(error.stderr || "")
      : "";
    const isDockerDaemonError =
      stderr.includes("Cannot connect to the Docker daemon") ||
      stderr.includes("Docker Desktop is a prerequisite");
    const isLocalStackNotRunning =
      stderr.includes("supabase start is not running") ||
      stderr.includes("Try rerunning the command with --debug");

    if (!isDockerDaemonError && !isLocalStackNotRunning) {
      throw error;
    }

    console.log("\nLocal Supabase reset is unavailable. Falling back to remote database push...");

    const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
    const pushArgs = projectRef
      ? ["supabase", "db", "push", "--project-ref", projectRef, "--include-all"]
      : ["supabase", "db", "push", "--linked", "--include-all"];

    try {
      await run("npx", pushArgs);
      console.log("Done. Migrations applied to remote database.");
    } catch (pushError) {
      const pushStderr =
        pushError && typeof pushError === "object" && "stderr" in pushError
          ? String(pushError.stderr || "")
          : "";

      const needsLink = pushStderr.includes("Cannot find project ref. Have you run supabase link?");
      if (needsLink && !projectRef) {
        console.error("\nCannot find linked Supabase project.");
        console.error("Run one of these, then retry `npm run db:reset`:");
        console.error("1) npx supabase link --project-ref <your-project-ref>");
        console.error("2) SUPABASE_PROJECT_REF=<your-project-ref> npm run db:reset");
      }
      throw pushError;
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
