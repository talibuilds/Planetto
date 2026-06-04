import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const res = await model.generateContent("Hello");
    console.log(res.response.text());
  } catch (err) {
    console.error("1.5-flash error:", err.message);
  }

  try {
    const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const res = await model2.generateContent("Hello");
    console.log(res.response.text());
  } catch (err) {
    console.error("1.5-pro error:", err.message);
  }
}

run();
