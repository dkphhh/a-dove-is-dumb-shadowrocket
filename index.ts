import { YAML } from "bun";
import * as fs from "fs";

// 上游 Clash 规则地址
const SOURCE_URL =
  "https://raw.githubusercontent.com/ignaciocastro/a-dove-is-dumb/main/clash.yaml";
// 输出文件名
const OUTPUT_FILE = "adobe-reject.conf";

// 定义 Clash 配置文件的大致结构接口
interface ClashConfig {
  payload: string[];
}

async function convert() {
  console.log(`Downloading from ${SOURCE_URL}...`);
  try {
    const response = await fetch(SOURCE_URL);
    const yamlText = await response.text();
    // 解析 YAML
    const data = YAML.parse(yamlText) as ClashConfig;

    if (!data || !data.payload) {
      throw new Error("Invalid format: 'payload' field not found in YAML.");
    }
    const payloads = data.payload;
    console.log(`Found ${payloads.length} rules. Converting...`);
    // 准备文件头部信息
    const header = [
      `#!name=Adobe Block List for Shadowrocket`,
      `#!desc=a set of Shadowrocket rules designed to automatically block Adobe telemetry.`,
      `# Adobe Block List for Shadowrocket`,
      `# Source: ${SOURCE_URL}`,
      `# Updated: ${new Date().toUTCString()}`,
      ``, // 空行
      ``, // 空行
      `[Rule]`,
      ``, // 空行
    ].join("\n");
    // 转换规则
    // Clash 格式: DOMAIN,ic.adobe.io
    // Shadowrocket 格式: DOMAIN,ic.adobe.io,REJECT
    const rules = payloads
      .filter((rule) => rule && rule.trim().length > 0)
      .map((rule) => `${rule.trim()},REJECT`)
      .join("\n");

    const finalContent = `${header}\n${rules}`;
    // 写入文件
    fs.writeFileSync(OUTPUT_FILE, finalContent, "utf-8");
    console.log(`Success! Saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error during conversion:", error);
    process.exit(1);
  }
}

convert();
