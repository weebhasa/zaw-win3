import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

export const handleQuestionSets: RequestHandler = (_req, res) => {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const files = fs.readdirSync(publicDir);
    const filtered = files.filter(
      (f) => f.endsWith("Questions.json") || f === "mcqs_q1_q210.json"
    );

    const sets = filtered.map((filename) => {
      try {
        const content = fs.readFileSync(path.join(publicDir, filename), "utf-8");
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
    res.status(500).json({ error: "Failed to load question sets" });
  }
};
