#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = "/home/ubuntu/.openclaw/workspace";

async function compileBrainDump() {
  const sections = [];

  // 1. Cron Jobs
  try {
    const cronResult = execSync('crontab -l 2>/dev/null || echo "No crontab"', { encoding: 'utf-8' });
    sections.push({
      title: "Cron Jobs",
      content: `<pre>${escapeHtml(cronResult)}</pre>`
    });
  } catch (err) {
    sections.push({
      title: "Cron Jobs",
      content: `<p style="color: #C8853F;">Error reading crontab: ${escapeHtml(err.message)}</p>`
    });
  }

  // 2. Environment Variables & Credentials
  try {
    const envPath = path.join(WORKSPACE, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      sections.push({
        title: "Environment Variables (.env)",
        content: `<pre>${escapeHtml(envContent)}</pre>`
      });
    }
  } catch (err) {
    sections.push({
      title: "Environment Variables",
      content: `<p style="color: #C8853F;">Error reading .env: ${escapeHtml(err.message)}</p>`
    });
  }

  // 3. Main Memory (MEMORY.md)
  try {
    const memoryPath = path.join(WORKSPACE, 'MEMORY.md');
    if (fs.existsSync(memoryPath)) {
      const memoryContent = fs.readFileSync(memoryPath, 'utf-8');
      sections.push({
        title: "Main Memory (MEMORY.md)",
        content: `<pre>${escapeHtml(memoryContent)}</pre>`
      });
    }
  } catch (err) {
    sections.push({
      title: "Main Memory",
      content: `<p style="color: #C8853F;">Error reading MEMORY.md: ${escapeHtml(err.message)}</p>`
    });
  }

  // 4. Recent Daily Memory Files
  try {
    const memoryDir = path.join(WORKSPACE, 'memory');
    if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir)
        .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
        .sort()
        .reverse()
        .slice(0, 7); // Last 7 days

      if (files.length > 0) {
        const dailyMemories = files.map(file => {
          const content = fs.readFileSync(path.join(memoryDir, file), 'utf-8');
          return `<h4 style="color: #C8853F; margin-top: 20px;">${file}</h4><pre>${escapeHtml(content)}</pre>`;
        }).join('\n');

        sections.push({
          title: "Recent Daily Memory (Last 7 Days)",
          content: dailyMemories
        });
      }
    }
  } catch (err) {
    sections.push({
      title: "Recent Daily Memory",
      content: `<p style="color: #C8853F;">Error reading daily memory: ${escapeHtml(err.message)}</p>`
    });
  }

  // 5. OpenClaw Cron Jobs
  try {
    const cronListResult = execSync('openclaw cron list --json 2>/dev/null || echo "[]"', { 
      encoding: 'utf-8',
      cwd: WORKSPACE
    });
    const cronJobs = JSON.parse(cronListResult);
    
    if (Array.isArray(cronJobs) && cronJobs.length > 0) {
      const jobsHtml = cronJobs.map(job => `
        <div style="border-left: 3px solid #C8853F; padding-left: 15px; margin: 15px 0;">
          <strong>${escapeHtml(job.name || job.id)}</strong><br>
          <span style="color: #8A8A80;">ID:</span> ${escapeHtml(job.id)}<br>
          ${job.description ? `<span style="color: #8A8A80;">Description:</span> ${escapeHtml(job.description)}<br>` : ''}
          <span style="color: #8A8A80;">Enabled:</span> ${job.enabled ? '✓' : '✗'}<br>
          <span style="color: #8A8A80;">Schedule:</span> ${escapeHtml(JSON.stringify(job.schedule || {}))}<br>
          ${job.lastRunAtMs ? `<span style="color: #8A8A80;">Last Run:</span> ${new Date(job.lastRunAtMs).toISOString()}<br>` : ''}
          ${job.nextRunAtMs ? `<span style="color: #8A8A80;">Next Run:</span> ${new Date(job.nextRunAtMs).toISOString()}<br>` : ''}
        </div>
      `).join('\n');

      sections.push({
        title: "OpenClaw Cron Jobs",
        content: jobsHtml
      });
    }
  } catch (err) {
    sections.push({
      title: "OpenClaw Cron Jobs",
      content: `<p style="color: #C8853F;">Error reading OpenClaw cron: ${escapeHtml(err.message)}</p>`
    });
  }

  // 6. Project Structure
  try {
    const sitesDir = path.join(WORKSPACE, 'sites');
    if (fs.existsSync(sitesDir)) {
      const sites = fs.readdirSync(sitesDir).filter(f => {
        const stat = fs.statSync(path.join(sitesDir, f));
        return stat.isDirectory();
      }).sort();

      sections.push({
        title: `Projects (${sites.length} sites in /sites)`,
        content: `<pre>${escapeHtml(sites.join('\n'))}</pre>`
      });
    }
  } catch (err) {
    sections.push({
      title: "Projects",
      content: `<p style="color: #C8853F;">Error reading projects: ${escapeHtml(err.message)}</p>`
    });
  }

  return sections;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHtmlEmail(sections) {
  const date = new Date().toISOString().split('T')[0];
  
  const sectionsHtml = sections.map(section => `
    <div style="margin-bottom: 40px;">
      <h2 style="
        font-family: 'DM Serif Display', 'Roboto Slab', Georgia, serif;
        font-weight: 700;
        color: #1F2421;
        border-bottom: 2px solid #C8853F;
        padding-bottom: 10px;
      ">${section.title}</h2>
      <div style="margin-top: 15px;">
        ${section.content}
      </div>
    </div>
  `).join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #F6F1E8;
  margin: 0;
  padding: 20px;
  color: #1F2421;
">
  <div style="
    max-width: 900px;
    margin: 0 auto;
    background-color: #FFFFFF;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: 40px;
  ">
    <h1 style="
      font-family: 'DM Serif Display', 'Roboto Slab', Georgia, serif;
      font-weight: 700;
      color: #1F2421;
      font-size: 36px;
      margin-bottom: 10px;
    ">
      Daily Brain Dump
    </h1>
    <p style="
      color: #8A8A80;
      font-size: 14px;
      margin-bottom: 40px;
    ">
      ${date} • Automated daily snapshot
    </p>

    ${sectionsHtml}

    <div style="
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #E2D9C8;
      color: #8A8A80;
      font-size: 12px;
      text-align: center;
    ">
      Generated by OpenClaw • ${new Date().toISOString()}
    </div>
  </div>
</body>
</html>
  `;
}

async function saveAndNotify(htmlContent) {
  const date = new Date().toISOString().split('T')[0];
  const outputDir = path.join(WORKSPACE, 'brain-dumps');
  const outputPath = path.join(outputDir, `brain-dump-${date}.html`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save the HTML file
  fs.writeFileSync(outputPath, htmlContent, 'utf-8');
  
  console.log(`Brain dump saved to: ${outputPath}`);
  console.log(`File size: ${(htmlContent.length / 1024).toFixed(2)} KB`);
  
  return outputPath;
}

async function main() {
  try {
    console.log('Compiling brain dump...');
    const sections = await compileBrainDump();
    
    console.log('Building HTML report...');
    const htmlContent = buildHtmlEmail(sections);
    
    console.log('Saving brain dump...');
    const outputPath = await saveAndNotify(htmlContent);
    
    console.log(`\n✓ Brain dump generated successfully`);
    console.log(`  Location: ${outputPath}`);
    console.log(`  Sections: ${sections.length}`);
    console.log(`\nNote: Email credentials expired. Brain dump saved locally.`);
    console.log(`To send via email, configure valid SMTP/OAuth credentials.`);
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Brain dump failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
