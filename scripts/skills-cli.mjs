#!/usr/bin/env node

/**
 * AI File Manager — Skills CLI
 *
 * Usage:
 *   node scripts/skills-cli.mjs add <repo-url> --skill <skill-name>
 *   node scripts/skills-cli.mjs add <repo-url>
 *   node scripts/skills-cli.mjs list
 *   node scripts/skills-cli.mjs check-updates
 *   node scripts/skills-cli.mjs update <id>
 *   node scripts/skills-cli.mjs remove <id>
 *
 * Examples:
 *   node scripts/skills-cli.mjs add https://github.com/unclecatvn/agent-skills --skill odoo-18
 *   node scripts/skills-cli.mjs add vercel-labs/skills --skill ui-ux-pro-max
 *   node scripts/skills-cli.mjs add vercel-labs/skills/find-skills
 *   node scripts/skills-cli.mjs list
 *
 * Environment:
 *   API_BASE_URL — defaults to http://localhost:3000
 */

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";

const [, , command, ...rest] = process.argv;

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

function log(msg) {
  console.log(msg);
}
function success(msg) {
  log(`${COLORS.green}✓${COLORS.reset} ${msg}`);
}
function error(msg) {
  log(`${COLORS.red}✗${COLORS.reset} ${msg}`);
}
function info(msg) {
  log(`${COLORS.cyan}ℹ${COLORS.reset} ${msg}`);
}

function parseArgs(args) {
  const result = { positional: [], flags: {} };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val =
        args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
      result.flags[key] = val;
    } else {
      result.positional.push(args[i]);
    }
  }
  return result;
}

async function apiCall(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json();
    return { ok: res.ok, status: res.status, ...json };
  } catch {
    return {
      ok: false,
      error: `Cannot connect to ${API_BASE}. Is the dev server running?`,
    };
  }
}

// ─── Commands ───

async function cmdAdd(args) {
  const { positional, flags } = parseArgs(args);
  const repoUrl = positional[0];
  const skillName = flags.skill || null;

  if (!repoUrl) {
    error("Missing repo URL");
    log("");
    log(
      `Usage: ${COLORS.dim}node scripts/skills-cli.mjs add <repo-url> [--skill <name>]${COLORS.reset}`,
    );
    log(
      `Example: ${COLORS.dim}node scripts/skills-cli.mjs add https://github.com/unclecatvn/agent-skills --skill odoo-18${COLORS.reset}`,
    );
    process.exit(1);
  }

  info(
    `Installing skill from ${COLORS.bold}${repoUrl}${COLORS.reset}${skillName ? ` → ${COLORS.bold}${skillName}${COLORS.reset}` : ""}...`,
  );

  const payload = { repo_url: repoUrl };
  if (skillName) payload.skill_name = skillName;

  const result = await apiCall("/api/skills", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (result.ok) {
    success(`Installed ${COLORS.bold}${result.data.name}${COLORS.reset}`);
    log(
      `   ${COLORS.dim}ID: ${result.data.id} | Version: ${result.data.installed_version || "—"} | Repo: ${result.data.repo_url}${COLORS.reset}`,
    );
    if (result.data.description) {
      log(`   ${COLORS.dim}${result.data.description}${COLORS.reset}`);
    }
  } else {
    error(result.error || "Install failed");
    if (result.status === 409) {
      info("Skill is already installed. Use 'list' to see installed skills.");
    }
  }
}

async function cmdList() {
  info("Fetching installed skills...");
  const result = await apiCall("/api/skills");

  if (!result.ok) {
    error(result.error || "Failed to fetch skills");
    return;
  }

  const skills = result.data || [];
  if (skills.length === 0) {
    log(
      `\n   ${COLORS.dim}No skills installed yet. Use 'add' to install one.${COLORS.reset}\n`,
    );
    return;
  }

  log(`\n${COLORS.bold}  Installed Skills (${skills.length})${COLORS.reset}\n`);
  log(
    `  ${"ID".padEnd(6)}${"Name".padEnd(30)}${"Version".padEnd(14)}${"Update".padEnd(10)}Repo`,
  );
  log(`  ${COLORS.dim}${"─".repeat(90)}${COLORS.reset}`);

  for (const s of skills) {
    const update = s.has_update
      ? `${COLORS.yellow}update${COLORS.reset}`
      : `${COLORS.green}latest${COLORS.reset}`;
    log(
      `  ${String(s.id).padEnd(6)}${s.name.slice(0, 28).padEnd(30)}${(s.installed_version || "—").slice(0, 12).padEnd(14)}${update.padEnd(10 + 9)}${COLORS.dim}${s.repo_url}${COLORS.reset}`,
    );
  }
  log("");
}

async function cmdCheckUpdates() {
  info("Checking for updates...");
  const result = await apiCall("/api/skills/check-updates", { method: "POST" });

  if (!result.ok) {
    error(result.error || "Check failed");
    return;
  }

  log(`\n   Checked: ${result.checked} skills`);
  if (result.updates_available > 0) {
    success(
      `${COLORS.yellow}${result.updates_available} update(s) available${COLORS.reset}`,
    );
    for (const r of (result.results || []).filter((r) => r.has_update)) {
      log(
        `   ${COLORS.yellow}↑${COLORS.reset} ${r.name} → ${r.latest_version}`,
      );
    }
  } else {
    success("All skills are up to date");
  }
  log("");
}

async function cmdUpdate(args) {
  const id = args[0];
  if (!id) {
    error("Missing skill ID. Run 'list' to see IDs.");
    process.exit(1);
  }

  info(`Updating skill #${id}...`);
  const result = await apiCall(`/api/skills/${id}`, { method: "PATCH" });

  if (result.ok) {
    success(
      `Updated ${COLORS.bold}${result.data.name}${COLORS.reset} to ${result.data.installed_version}`,
    );
  } else {
    error(result.error || "Update failed");
  }
}

async function cmdRemove(args) {
  const id = args[0];
  if (!id) {
    error("Missing skill ID. Run 'list' to see IDs.");
    process.exit(1);
  }

  info(`Removing skill #${id}...`);
  const result = await apiCall(`/api/skills/${id}`, { method: "DELETE" });

  if (result.ok || result.success) {
    success("Skill removed");
  } else {
    error(result.error || "Remove failed");
  }
}

function showHelp() {
  log(`
${COLORS.bold}AI File Manager — Skills CLI${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  node scripts/skills-cli.mjs <command> [options]

${COLORS.cyan}Commands:${COLORS.reset}
  add <repo-url> [--skill <name>]   Install a skill from GitHub
  list                               List all installed skills
  check-updates                      Check all skills for updates
  update <id>                        Update a skill to latest version
  remove <id>                        Uninstall a skill

${COLORS.cyan}Examples:${COLORS.reset}
  ${COLORS.dim}# Install a specific skill from a multi-skill repo${COLORS.reset}
  node scripts/skills-cli.mjs add https://github.com/unclecatvn/agent-skills --skill odoo-18

  ${COLORS.dim}# Install from skills.sh shorthand${COLORS.reset}
  node scripts/skills-cli.mjs add vercel-labs/skills --skill ui-ux-pro-max

  ${COLORS.dim}# Install skill at repo root${COLORS.reset}
  node scripts/skills-cli.mjs add vercel-labs/skills/find-skills

  ${COLORS.dim}# Batch install multiple skills${COLORS.reset}
  node scripts/skills-cli.mjs add unclecatvn/agent-skills --skill odoo-18
  node scripts/skills-cli.mjs add unclecatvn/agent-skills --skill sales-bot
  node scripts/skills-cli.mjs add unclecatvn/agent-skills --skill crm-rules

${COLORS.cyan}Environment:${COLORS.reset}
  API_BASE_URL   Server URL (default: http://localhost:3000)
`);
}

// ─── Main ───

switch (command) {
  case "add":
    cmdAdd(rest);
    break;
  case "list":
  case "ls":
    cmdList();
    break;
  case "check-updates":
  case "check":
    cmdCheckUpdates();
    break;
  case "update":
  case "up":
    cmdUpdate(rest);
    break;
  case "remove":
  case "rm":
  case "delete":
    cmdRemove(rest);
    break;
  default:
    showHelp();
}
