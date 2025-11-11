// src/utils/aiService.ts
// OpenAI GPT-4 Vision Integration for Device Recognition

export interface DeviceRecognitionResult {
  deviceType?: string;
  deviceName?: string;
  brand?: string;
  model?: string;
  batteryType?: string;
  confidence: number;
  rawResponse?: string;
}

/**
 * Analyzes an image using OpenAI GPT-4 Vision to extract device information
 * @param imageFile - The image file to analyze
 * @returns Promise with device recognition results
 */
export async function analyzeDeviceImage(imageFile: File): Promise<DeviceRecognitionResult> {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key nicht konfiguriert. Bitte REACT_APP_OPENAI_API_KEY in .env.local setzen.');
  }

  // Convert image to base64
  const base64Image = await fileToBase64(imageFile);

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

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',  // gpt-4o has vision capabilities
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageFile.type};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.2  // Lower temperature for more consistent results
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API Fehler: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Keine Antwort von OpenAI API erhalten');
    }

    console.log('OpenAI Response:', content);

    // Parse JSON response
    let result: DeviceRecognitionResult;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonString);

      result = {
        deviceType: parsed.deviceType || undefined,
        deviceName: parsed.deviceName || undefined,
        brand: parsed.brand || undefined,
        model: parsed.model || undefined,
        batteryType: parsed.batteryType || undefined,
        confidence: parsed.confidence || 50,
        rawResponse: content
      };
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Konnte AI-Antwort nicht verarbeiten. Bitte versuche es erneut.');
    }

    return result;
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    throw error;
  }
}

/**
 * Converts a File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Maps AI-detected device type to VoltFox device type
 */
export function mapToDeviceType(aiType: string | undefined): string {
  if (!aiType) return 'other';

  const normalized = aiType.toLowerCase();
  const validTypes = [
    'drone', 'camera', 'laptop', 'phone', 'tablet',
    'smartwatch', 'headphones', 'speaker', 'e-bike', 'other'
  ];

  return validTypes.includes(normalized) ? normalized : 'other';
}
