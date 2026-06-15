const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key'
});

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Parses a natural language segment prompt into a JSON rule object
 */
async function parseSegmentPrompt(prompt) {
  const systemPrompt = `You are a CRM segment rule parser. Given a natural language description of a customer audience, return ONLY a valid JSON object with this exact structure:
{
  "name": "short segment name",
  "description": "what this segment means",
  "rules": {
    "operator": "AND",
    "conditions": [
      { "field": "totalSpend", "op": "gt", "value": 5000 },
      { "field": "lastOrderDate", "op": "lt", "value": "90_DAYS_AGO" }
    ]
  }
}
Valid fields: totalSpend, orderCount, lastOrderDate, city, tags
Valid ops: gt, lt, eq, gte, lte, contains
For date comparisons, use value format: "N_DAYS_AGO" (e.g. "90_DAYS_AGO")
Return ONLY the JSON. No explanation. No markdown.`;

  try {
    console.log(`[GROQ] Calling API for: "${prompt.substring(0, 60)}..."`);
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: MODEL,
      temperature: 0,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content || '{}';
    // Clean up potential markdown wrapper just in case response_format is ignored by older models
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedRules = JSON.parse(cleanContent);
    
    console.log(`[GROQ] Response received, parsing JSON rules...`);
    console.log(`[GROQ] Segment parsed:`, JSON.stringify(parsedRules, null, 2));
    
    return parsedRules;
  } catch (error) {
    console.error('Groq Error in parseSegmentPrompt:', error);
    throw new Error('Failed to parse segment with AI');
  }
}

/**
 * Drafts 3 message variations based on segment context
 */
async function draftMessage(segmentDescription, channel, brandTone) {
  const systemPrompt = `You are a D2C brand marketing copywriter. Write a short, personalized ${channel} message for this audience: ${segmentDescription}. 
Rules:
- Use {{name}} for customer name placeholder
- Keep it under 160 chars for SMS, under 300 chars for WhatsApp/Email
- Tone: ${brandTone}
- No fake offers. Be genuine and human.
Return a JSON object containing an array of exactly 3 message variations. Format: { "messages": ["msg1", "msg2", "msg3"] }
Return ONLY the JSON object. No explanation.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please draft the messages.` }
      ],
      model: MODEL,
      temperature: 0.7,
      // Workaround: Groq sometimes needs explicit JSON schema or object type. 
      // We'll wrap the array in an object to ensure JSON mode compliance.
      response_format: { type: 'json_object' }
    });

    let content = completion.choices[0]?.message?.content || '{"messages":[]}';
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
      // If it returned an array directly despite json_object (some models do)
      if (Array.isArray(parsed)) return parsed;
      // If it returned { "messages": [...] } or similar
      const keys = Object.keys(parsed);
      if (keys.length > 0 && Array.isArray(parsed[keys[0]])) {
        return parsed[keys[0]];
      }
      return [cleanContent]; // fallback
    } catch (e) {
      return [content]; // fallback
    }
  } catch (error) {
    console.error('Groq Error in draftMessage:', error);
    throw new Error('Failed to draft message with AI');
  }
}

module.exports = {
  parseSegmentPrompt,
  draftMessage
};
