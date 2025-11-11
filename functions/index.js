/**
 * VoltFox Cloud Functions
 * Secure backend API for sensitive operations like OpenAI calls
 */

const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const OpenAI = require('openai');

// Define secret for OpenAI API key
const openaiApiKey = defineSecret('OPENAI_API_KEY');

/**
 * Analyzes device image using OpenAI GPT-4 Vision
 *
 * @param {Object} data - Request data containing base64Image
 * @param {Object} context - Auth context
 * @returns {Object} Device recognition result
 */
exports.analyzeDeviceImage = onCall(
  {secrets: [openaiApiKey]},
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to use AI analysis'
      );
    }

    const {base64Image, fileType} = request.data;

    if (!base64Image || !fileType) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required parameters: base64Image and fileType'
      );
    }

    try {
      // Initialize OpenAI client with secret
      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

      const prompt = `Analyze this device image and extract the following information in JSON format:

{
  "deviceType": "one of: drone, camera, laptop, phone, tablet, smartwatch, headphones, speaker, e-bike, other",
  "deviceName": "full product name if visible (e.g., 'DJI Mavic 3 Pro')",
  "brand": "brand name (e.g., 'DJI', 'Canon', 'Apple')",
  "model": "model number or name",
  "batteryType": "battery chemistry if visible or can be inferred: LiPo, Li-ion, NiMH, or Lead-Acid",
  "confidence": "confidence level from 0-100"
}

Important:
- Only return the JSON object, no additional text
- Use lowercase for deviceType
- If information is not visible or unclear, use null
- For batteryType, use your knowledge of common battery types for this device category
- Drones typically use LiPo batteries
- Phones/laptops typically use Li-ion batteries`;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // gpt-4o has vision capabilities
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      });

      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        throw new HttpsError('internal', 'No response from OpenAI API');
      }

      console.log('OpenAI Response:', content);

      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonString);

        return {
          deviceType: parsed.deviceType || null,
          deviceName: parsed.deviceName || null,
          brand: parsed.brand || null,
          model: parsed.model || null,
          batteryType: parsed.batteryType || null,
          confidence: parsed.confidence || 50,
          rawResponse: content,
        };
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new HttpsError(
          'internal',
          'Could not parse AI response'
        );
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);

      // Handle OpenAI API errors
      if (error.status === 429) {
        throw new HttpsError(
          'resource-exhausted',
          'OpenAI API quota exceeded. Please check your billing.'
        );
      }

      throw new HttpsError(
        'internal',
        `AI analysis failed: ${error.message}`
      );
    }
  }
);
