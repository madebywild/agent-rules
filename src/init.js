import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { confirm, input } from "@inquirer/prompts";
import { ensureDir } from "./utils.js";

function resolveRepoPath(...segments) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "..", ...segments);
}

async function copyDirRecursive(srcDir, destDir) {
  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function runInit() {
  console.log("\n🧰 rules-translator initialization\n");

  const cwd = process.cwd();
  const defaultRulesDir = path.resolve(cwd, "agent-rules");

  const rulesDir = await input({
    message: "Where should your rules live?",
    default: defaultRulesDir,
  });

  await ensureDir(rulesDir);

  const bundledRulesDir = resolveRepoPath("agent-rules");
  let bundledExists = false;
  try {
    await fs.access(bundledRulesDir, fs.constants.F_OK);
    bundledExists = true;
  } catch {}

  if (bundledExists) {
    const copyBundled = await confirm({
      message: "Copy pre-bundled example rules into your workspace?",
      default: true,
    });

    if (copyBundled) {
      // Detect potential overwrite
      let hasExisting = false;
      try {
        const current = await fs.readdir(rulesDir);
        hasExisting = current.length > 0;
      } catch {}

      if (hasExisting) {
        const allowOverwrite = await confirm({
          message: `The target directory '${rulesDir}' is not empty. Overwrite conflicting files?`,
          default: false,
        });
        if (!allowOverwrite) {
          console.log("⚠️  Skipped copying bundled rules.");
        } else {
          await copyDirRecursive(bundledRulesDir, rulesDir);
          console.log(`✅ Copied bundled rules into '${rulesDir}'.`);
        }
      } else {
        await copyDirRecursive(bundledRulesDir, rulesDir);
        console.log(`✅ Copied bundled rules into '${rulesDir}'.`);
      }
    } else {
      console.log("ℹ️  Skipped copying bundled rules.");
    }
  } else {
    console.log("ℹ️  No bundled rules found to copy.");
  }

  // Create .gitignore entries for generated outputs if missing
  const gitignorePath = path.resolve(cwd, ".gitignore");
  const suggestedIgnores = [".cursor/", ".clinerules/", "CLAUDE.md"];
  try {
    let existing = "";
    try {
      existing = await fs.readFile(gitignorePath, "utf8");
    } catch {}
    const additions = suggestedIgnores.filter((e) => !existing.includes(e));
    if (additions.length > 0) {
      const add = await confirm({
        message: `Add ${additions.length} ignore entr${
          additions.length === 1 ? "y" : "ies"
        } to .gitignore?`,
        default: true,
      });
      if (add) {
        const newContent =
          (existing ? existing.trimEnd() + "\n" : "") +
          additions.join("\n") +
          "\n";
        await fs.writeFile(gitignorePath, newContent, "utf8");
        console.log("✅ Updated .gitignore.");
      }
    }
  } catch (e) {
    console.log(`⚠️  Could not update .gitignore: ${e.message}`);
  }

  console.log(
    "\n🎉 Initialization complete. You can now run: \n   npx rules-translator\n"
  );
}
