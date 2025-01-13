import fs from "fs";
import path from "path";

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyFile(src, dest) {
  try {
    if (await fileExists(dest)) {
      console.log(`File already exists at ${dest}, skipping copy.`);
    } else {
      await fs.promises.copyFile(src, dest);
      console.log(`Copied ${src} to ${dest}`);
    }
  } catch (err) {
    console.error(`Error copying file from ${src} to ${dest}:`, err);
  }
}

async function createFolder(folderPath) {
  try {
    const folderExists = await fs.promises
      .access(folderPath)
      .then(() => true)
      .catch(() => false);

    if (!folderExists) {
      await fs.promises.mkdir(folderPath, { recursive: true });
      console.log(`Created folder: ${folderPath}`);
    }
  } catch (err) {
    console.error(`Error creating folder ${folderPath}:`, err);
  }
}

async function fixMgoImports(dir) {
  try {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        await fixMgoImports(fullPath);
      } else if (file.isFile() && file.name.endsWith(".js")) {
        const content = await fs.promises.readFile(fullPath, "utf-8");
        if (content.includes('from "../utils/mgo-types"')) {
          const updatedContent = content.replace(
            /from "\.\.\/utils\/mgo-types"/g,
            'from "../utils/mgo-types.js"'
          );
          await fs.promises.writeFile(fullPath, updatedContent, "utf-8");
          console.log(`Fixed imports in: ${fullPath}`);
        }
        if (content.includes('from "./mgo-system-state"')) {
          const updatedContent = content.replace(
            /from "\.\/mgo-system-state"/g,
            'from "./mgo-system-state.js"'
          );
          await fs.promises.writeFile(fullPath, updatedContent, "utf-8");
          console.log(`Fixed imports in: ${fullPath}`);
        }
      }
    }
  } catch (err) {
    console.error(`Error fixing imports in directory ${dir}:`, err);
  }
}

const copyOperations = [
  {
    src: path.join("config", "proxy_list_tmp.js"),
    dest: path.join("config", "proxy_list.js"),
  },
  {
    src: path.join("config", "config_tmp.js"),
    dest: path.join("config", "config.js"),
  },
  {
    src: path.join("accounts", "accounts_tmp.js"),
    dest: path.join("accounts", "accounts.js"),
  },
];

(async () => {
  console.log(`Copying Template File`);
  await createFolder("accounts");
  for (let { src, dest } of copyOperations) {
    await copyFile(src, dest);
  }
  console.log(`\nFixing @mgonetwork/mango.js imports...`);
  const packageDir = path.join("node_modules", "@mgonetwork", "mango.js");
  if (await fileExists(packageDir)) {
    await fixMgoImports(packageDir);
  } else {
    console.error(`Directory ${packageDir} not found. Skipping import fixes.`);
  }

  console.log(`\nSetup Complete`);
  console.log(
    `Open and configure\n- accounts/accounts.js\n- config/config.js\n `
  );
})();
