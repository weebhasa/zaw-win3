import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

export const handleQuestionSets: RequestHandler = (_req, res) => {
  try {
    const possibleDirs = [
      path.join(process.cwd(), "public"),
      path.join(process.cwd(), "dist/spa"),
      path.join(process.cwd(), "spa"),
    ];

    let publicDir = possibleDirs.find((dir) => fs.existsSync(dir)) || possibleDirs[0];

    const files = fs.readdirSync(publicDir).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    const filtered = files.filter(
      (f) => f.endsWith(".json") && f !== "package.json" && f !== "tsconfig.json" && f !== "components.json",
    );

    const sets = filtered.map((filename) => {
      try {
        const content = fs.readFileSync(
          path.join(publicDir, filename),
          "utf-8",
        );
        const json = JSON.parse(content);
        return {
          filename,
          title: json.title || filename.replace(".json", ""),
        };
      } catch {
        return null;
      }
    });

    res.json(sets.filter(Boolean));
  } catch (error) {
    console.error("Error loading question sets:", error);
    res.status(500).json({ error: "Failed to load question sets" });
  }
};
