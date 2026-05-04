const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate code
router.post('/generate', [
  body('prompt').notEmpty().trim().escape(),
  body('language').optional().trim().escape(),
  body('action').isIn(['generate', 'fix', 'explain']).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prompt, language = 'javascript', action = 'generate', code = '' } = req.body;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'generate':
        systemPrompt = `You are an expert programmer. Generate clean, well-documented ${language} code. Always wrap code in triple backticks with the language identifier. Include expected output explanation.`;
        userPrompt = `Generate ${language} code for: ${prompt}

Requirements:
1. Use proper formatting and indentation
2. Include comments explaining complex logic
3. Show expected output
4. Handle edge cases`;
        break;

      case 'fix':
        systemPrompt = `You are a code debugging expert. Fix the provided ${language} code. Show the corrected code and explain what was wrong.`;
        userPrompt = `Fix this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Issues to fix: ${prompt}

Provide:
1. Fixed code
2. Explanation of errors
3. Expected output`;
        break;

      case 'explain':
        systemPrompt = `You are a programming tutor. Explain the provided ${language} code in detail, breaking down each section.`;
        userPrompt = `Explain this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Line-by-line explanation
2. Time/space complexity if applicable
3. Potential improvements`;
        break;

      default:
        systemPrompt = `You are a helpful coding assistant.`;
        userPrompt = prompt;
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;

    // Extract code blocks
   const codeBlocks = [];
const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;

let match;
while ((match = codeRegex.exec(response)) !== null) {
  codeBlocks.push({
    language: match[1] || language,
    code: match[2].trim()
  });
}

    // Extract explanation (text outside code blocks)
    let explanation = response.replace(/```(\w+)?\n[\s\S]*?```/g, '').trim();

res.json({
  success: true,
  response,
  codeBlocks,
  explanation,
  language,
  action
});

  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate code. Please try again.',
      details: error.message
    });
  }
});

// Run code (simulated - in production, use a sandboxed environment)
router.post('/run', [
  body('code').notEmpty(),
  body('language').notEmpty()
], async (req, res) => {
  try {
    const { code, language, input = '' } = req.body;

    // For demo purposes, return a simulated output
    // In production, use Docker containers or services like Piston API
    const systemPrompt = `You are a code execution simulator. Given ${language} code and input, show what the output would be. Be precise and show actual output format.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_API_KEY ? (process.env.OPENAI_MODEL || 'gpt-4') : 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Code:
\`\`\`${language}
${code}
\`\`\`

Input: ${input}

Show the exact output that would be produced.` }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    res.json({
      success: true,
      output: completion.choices[0].message.content,
      language,
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Run Code Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run code',
      details: error.message
    });
  }
});

module.exports = router;
