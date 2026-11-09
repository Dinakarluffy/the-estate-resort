import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const tddMdPath = path.resolve("TDD.md");
const tddHtmlPath = path.resolve("TDD.html");
const tddPdfPath = path.resolve("TDD.pdf");

const mdContent = fs.readFileSync(tddMdPath, "utf-8");

async function fetchMermaidSvg(mermaidCode, index) {
  const cachedPath = path.resolve("scratch", `diagram-${index}.svg`);
  if (fs.existsSync(cachedPath)) {
    return fs.readFileSync(cachedPath, "utf-8");
  }

  try {
    const base64 = Buffer.from(mermaidCode).toString("base64");
    const url = `https://mermaid.ink/svg/${base64}`;
    const res = await fetch(url);
    if (res.ok) {
      const svg = await res.text();
      fs.writeFileSync(cachedPath, svg, "utf-8");
      return svg;
    }
  } catch (err) {
    console.error(`Failed to fetch mermaid SVG for diagram ${index}:`, err.message);
  }
  return null;
}

// Convert markdown to rich HTML with SVG Mermaid Diagrams and styled tables
async function mdToHtml(md) {
  let lines = md.split("\n");
  let inCode = false;
  let codeLang = "";
  let codeBuffer = [];
  let inTable = false;
  let tableBuffer = [];
  let html = [];
  let mermaidIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks
    if (line.trim().startsWith("```")) {
      if (inCode) {
        if (codeLang.toLowerCase() === "mermaid") {
          const rawCode = codeBuffer.join("\n").trim();
          const svg = await fetchMermaidSvg(rawCode, mermaidIndex);
          if (svg) {
            html.push(`<div class="mermaid-diagram-card">
              <div class="diagram-header">Architecture Diagram ${mermaidIndex}</div>
              <div class="diagram-svg-wrap">${svg}</div>
            </div>`);
          } else {
            html.push(`<pre><code class="language-mermaid">${escapeHtml(rawCode)}</code></pre>`);
          }
          mermaidIndex++;
        } else {
          html.push(`<pre><code class="language-${codeLang}">${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        }
        inCode = false;
        codeBuffer = [];
      } else {
        inCode = true;
        codeLang = line.trim().replace(/^```/, "").trim();
        codeBuffer = [];
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Tables
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      inTable = true;
      tableBuffer.push(line.trim());
      continue;
    } else if (inTable) {
      html.push(renderTable(tableBuffer));
      inTable = false;
      tableBuffer = [];
    }

    // Headers
    if (line.startsWith("# ")) {
      html.push(`<h1>${parseInline(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      html.push(`<h2>${parseInline(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      html.push(`<h3>${parseInline(line.slice(4))}</h3>`);
    } else if (line.startsWith("#### ")) {
      html.push(`<h4>${parseInline(line.slice(5))}</h4>`);
    } else if (line.startsWith("---")) {
      html.push("<hr/>");
    } else if (line.startsWith("> ")) {
      html.push(`<blockquote>${parseInline(line.slice(2))}</blockquote>`);
    } else if (line.startsWith("* ") || line.startsWith("- ")) {
      html.push(`<li>${parseInline(line.slice(2))}</li>`);
    } else if (line.trim() === "") {
      html.push("<br/>");
    } else {
      html.push(`<p>${parseInline(line)}</p>`);
    }
  }

  if (inTable && tableBuffer.length > 0) {
    html.push(renderTable(tableBuffer));
  }

  return html.join("\n");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderTable(lines) {
  if (lines.length < 2) return "";
  let out = ["<table class=\"tdd-table\">"];
  
  // Header
  const headers = lines[0].split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
  out.push("<thead><tr>" + headers.map(h => `<th>${parseInline(h)}</th>`).join("") + "</tr></thead>");
  
  // Body
  out.push("<tbody>");
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
    out.push("<tr>" + cells.map(c => `<td>${parseInline(c)}</td>`).join("") + "</tr>");
  }
  out.push("</tbody></table>");
  return out.join("");
}

function parseInline(text) {
  let s = text;
  // math formatting
  s = s.replace(/\$([^\$]+)\$/g, "<em>$1</em>");
  // bold & italic
  s = s.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // inline code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // links
  s = s.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  return s;
}

async function build() {
  console.log("⏳ Converting TDD.md to rich HTML with SVG Mermaid vector diagrams...");
  const bodyHtml = await mdToHtml(mdContent);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Technical Design Document (TDD) - The Estate Resort</title>
  <style>
    @page {
      size: A4;
      margin: 18mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1a202c;
      background: #ffffff;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-size: 13px;
    }
    h1 {
      font-size: 24px;
      color: #242e20;
      border-bottom: 2px solid #242e20;
      padding-bottom: 8px;
      margin-top: 20px;
    }
    h2 {
      font-size: 18px;
      color: #2e3d28;
      border-bottom: 1px solid #cbd5e0;
      padding-bottom: 5px;
      margin-top: 25px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 15px;
      color: #3b4d33;
      margin-top: 18px;
      page-break-after: avoid;
    }
    p, li {
      color: #2d3748;
    }
    li {
      margin-bottom: 4px;
    }
    hr {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 20px 0;
    }
    blockquote {
      border-left: 4px solid #b45309;
      background: #fef3c7;
      padding: 10px 14px;
      margin: 12px 0;
      border-radius: 4px;
      font-size: 12px;
    }
    code {
      font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
      background: #edf2f7;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 12px;
      color: #c53030;
    }
    pre {
      background: #1a202c;
      color: #e2e8f0;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 11px;
      line-height: 1.45;
      page-break-inside: avoid;
    }
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    table.tdd-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 11.5px;
      page-break-inside: avoid;
    }
    table.tdd-table th {
      background: #242e20;
      color: #ffffff;
      padding: 7px 10px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #242e20;
    }
    table.tdd-table td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      color: #2d3748;
    }
    table.tdd-table tr:nth-child(even) td {
      background: #f7fafc;
    }
    a {
      color: #2b6cb0;
      text-decoration: none;
    }

    /* Mermaid Vector Diagram Cards */
    .mermaid-diagram-card {
      margin: 24px 0;
      padding: 16px;
      background: #fdfdfd;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      page-break-inside: avoid;
      text-align: center;
    }
    .diagram-header {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #718096;
      margin-bottom: 12px;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 6px;
    }
    .diagram-svg-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
    .diagram-svg-wrap svg {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    @media print {
      body {
        padding: 0;
        font-size: 11.5px;
      }
      h1 { font-size: 20px; }
      h2 { font-size: 16px; }
      h3 { font-size: 13.5px; }
      .mermaid-diagram-card {
        border: 1px solid #cbd5e0;
        page-break-inside: avoid;
      }
      table.tdd-table th {
        background: #242e20 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      pre {
        background: #1a202c !important;
        color: #e2e8f0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  fs.writeFileSync(tddHtmlPath, fullHtml, "utf-8");
  console.log(`✅ Generated TDD.html (${(fs.statSync(tddHtmlPath).size / 1024).toFixed(1)} KB) with embedded SVG diagrams`);

  // Generate PDF with headless chrome
  try {
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    if (fs.existsSync(chromePath)) {
      execSync(`"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${tddPdfPath}" "${tddHtmlPath}"`, {
        stdio: "ignore",
      });
      if (fs.existsSync(tddPdfPath)) {
        console.log(`✅ Successfully compiled TDD.pdf (${(fs.statSync(tddPdfPath).size / 1024).toFixed(1)} KB) with REAL VISUAL DIAGRAMS!`);
      }
    }
  } catch (err) {
    console.error("PDF generation failed:", err.message);
  }
}

build().catch(console.error);
