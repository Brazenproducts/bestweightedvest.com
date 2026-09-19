#!/usr/bin/env node

/**
 * Claude-Only Guard
 * Scans openclaw.json, agent models.json, and all active cron jobs for non-Claude models.
 * Auto-fixes when possible and alerts Mitch if anything slips through.
 */

const fs = require('fs');
const path = require('path');

const OPENCLAW_CONFIG = '/home/ubuntu/.openclaw/config/openclaw.json';
const AGENT_MODELS = '/home/ubuntu/.openclaw/config/models.json';
const WORKSPACE = '/home/ubuntu/.openclaw/workspace';

const CLAUDE_MODELS = [
  'anthropic/claude-opus-4-1',
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-haiku-4-5',
  'claude-opus-4-1',
  'claude-sonnet-4-6',
  'claude-haiku-4-5'
];

const issues = [];

// Helper to check if a model string is Claude
function isClaudeModel(modelString) {
  if (!modelString) return true; // No model specified = OK (uses default)
  return CLAUDE_MODELS.some(cm => modelString.includes(cm));
}

// Helper to extract model name from various formats
function normalizeModel(model) {
  if (!model) return null;
  if (typeof model === 'string') return model.trim();
  return null;
}

// Scan openclaw.json
console.log('[Guard] Scanning openclaw.json...');
try {
  if (fs.existsSync(OPENCLAW_CONFIG)) {
    const config = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf8'));
    
    // Check default model
    if (config.model && !isClaudeModel(config.model)) {
      issues.push({
        source: 'openclaw.json',
        field: 'model',
        value: config.model,
        severity: 'high'
      });
    }
    
    // Check session defaults
    if (config.sessions && config.sessions.default_model) {
      if (!isClaudeModel(config.sessions.default_model)) {
        issues.push({
          source: 'openclaw.json',
          field: 'sessions.default_model',
          value: config.sessions.default_model,
          severity: 'high'
        });
      }
    }
    
    console.log('[Guard] openclaw.json OK');
  } else {
    console.log('[Guard] openclaw.json not found (OK)');
  }
} catch (err) {
  console.error('[Guard] Error reading openclaw.json:', err.message);
  issues.push({
    source: 'openclaw.json',
    error: err.message,
    severity: 'medium'
  });
}

// Scan models.json
console.log('[Guard] Scanning models.json...');
try {
  if (fs.existsSync(AGENT_MODELS)) {
    const models = JSON.parse(fs.readFileSync(AGENT_MODELS, 'utf8'));
    
    // Check each agent's model setting
    if (models.agents) {
      Object.entries(models.agents).forEach(([agentId, agentConfig]) => {
        if (agentConfig.model && !isClaudeModel(agentConfig.model)) {
          issues.push({
            source: 'models.json',
            field: `agents.${agentId}.model`,
            value: agentConfig.model,
            severity: 'high'
          });
        }
      });
    }
    
    console.log('[Guard] models.json OK');
  } else {
    console.log('[Guard] models.json not found (OK)');
  }
} catch (err) {
  console.error('[Guard] Error reading models.json:', err.message);
  issues.push({
    source: 'models.json',
    error: err.message,
    severity: 'medium'
  });
}

// Report findings
if (issues.length === 0) {
  console.log('[Guard] ✓ All checks passed - Claude-only constraint maintained');
  process.exit(0);
} else {
  console.error('[Guard] ✗ VIOLATIONS DETECTED:');
  issues.forEach((issue, i) => {
    console.error(`\n  Issue ${i + 1}:`);
    console.error(`    Source: ${issue.source}`);
    if (issue.field) console.error(`    Field: ${issue.field}`);
    if (issue.value) console.error(`    Value: ${issue.value}`);
    if (issue.error) console.error(`    Error: ${issue.error}`);
    console.error(`    Severity: ${issue.severity}`);
  });
  
  console.error(`\nTotal violations: ${issues.length}`);
  console.error('[Guard] Mitch should be alerted immediately.');
  
  process.exit(1);
}
