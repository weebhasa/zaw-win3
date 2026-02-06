import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

export const handleGetQuestions: RequestHandler = (req, res) => {
  try {
    let filename = req.query.file as string;
    if (!filename) {
      return res.status(400).json({ error: "File parameter is required" });
    }

    // Attempt to decode in case it was passed encoded
    try {
      filename = decodeURIComponent(filename);
    } catch (e) {
      // Ignore decode errors
    }

    // Security: prevent directory traversal
    const safeFilename = path.basename(filename);
    
    const possibleDirs = [
      path.join(process.cwd(), "public"),
      path.join(process.cwd(), "dist/spa"),
      path.join(process.cwd(), "spa"),
    ];

    let publicDir = possibleDirs.find((dir) => fs.existsSync(dir)) || possibleDirs[0];
    let filePath = path.join(publicDir, safeFilename.endsWith(".json") ? safeFilename : `${safeFilename}.json`);

    if (!fs.existsSync(filePath)) {
      // Fallback: search directory for a case-insensitive or space-normalized match
      const files = fs.readdirSync(publicDir);
      const normalizedSearch = safeFilename.replace(/\.json$/, "").toLowerCase().trim().replace(/\s+/g, " ");

      const foundFile = files.find(f => {
        const normalizedFile = f.replace(/\.json$/, "").toLowerCase().trim().replace(/\s+/g, " ");
        return normalizedFile === normalizedSearch;
      });

      if (foundFile) {
        filePath = path.join(publicDir, foundFile);
      } else {
        return res.status(404).json({ error: "Question set not found" });
      }
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(content);
    res.json(json);
  } catch (error) {
    console.error("Error serving questions:", error);
    res.status(500).json({ error: "Failed to load questions" });
  }
};
