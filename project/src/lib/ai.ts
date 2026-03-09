/**
 * AI Analysis Service
 * Calls Anthropic Claude's vision API directly from the browser.
 * The API key is stored in localStorage so users only enter it once.
 */

export interface AIAnalysisResult {
  licensePlate: string | null;
  plateConfidence: number;
  occupantCount: number;
  occupantConfidence: number;
  violations: string[];
  rawDescription: string;
  timestamp: string;
}

const API_KEY_STORAGE_KEY = 'rcss_anthropic_api_key';

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export function hasApiKey(): boolean {
  return getStoredApiKey().length > 0;
}

/**
 * Converts a base64 data URL or raw base64 string to the format Claude expects.
 */
function extractBase64(imageData: string): { data: string; mediaType: string } {
  if (imageData.startsWith('data:')) {
    const [header, data] = imageData.split(',');
    const mediaType = header.split(';')[0].replace('data:', '') || 'image/jpeg';
    return { data, mediaType };
  }
  return { data: imageData, mediaType: 'image/jpeg' };
}

const ANALYSIS_PROMPT = `You are an expert road safety compliance system analyzing vehicle images for the Kenyan road transport authority (NTSA).

Analyze this image carefully and extract:

1. **License Plate**: Read any visible license plate text exactly as shown (Kenyan plates look like "KBE 100A", "KCA 234B", etc.). If no plate is visible or readable, return null.
2. **Plate Confidence**: How confident are you in reading the plate? (0-100)
3. **Occupant Count**: Count every person visible inside or on the vehicle (driver + passengers). If the vehicle interior isn't visible, estimate from what's visible.
4. **Occupant Confidence**: How confident are you in the occupant count? (0-100)
5. **Violations**: Identify any of these violations:
   - "overcrowding" — more passengers than the vehicle can safely carry (e.g., matatu with 15+ people, motorcycle with 2+ passengers, vehicle visibly overloaded with people)
   - "unsafe_loading" — goods loaded unsafely, protruding dangerously, or blocking driver visibility
   - "wrong_lane" — vehicle clearly in wrong lane or driving on the wrong side
   - "parking_violation" — parked illegally (on yellow lines, blocking junction, on pavement)
   - "no_seatbelt" — visible occupants not wearing seatbelts
   - "overloading" — goods overloaded beyond safe capacity

6. **Raw Description**: 1-2 sentence plain English description of what you see in the image.

Respond ONLY with valid JSON, no extra text:
{
  "licensePlate": "KBE 100A" or null,
  "plateConfidence": 87,
  "occupantCount": 4,
  "occupantConfidence": 82,
  "violations": ["overcrowding"],
  "rawDescription": "A matatu with visible overcrowding on Thika Road."
}`;

/**
 * Analyze an image using Claude's vision model.
 * Throws an error if the API key is missing or the API call fails.
 */
export async function analyzeImageWithAI(imageBase64: string): Promise<AIAnalysisResult> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const { data, mediaType } = extractBase64(imageBase64);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data,
              },
            },
            {
              type: 'text',
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = (errorData as any)?.error?.message || `API error: ${response.status}`;
    if (response.status === 401) throw new Error('INVALID_API_KEY');
    if (response.status === 429) throw new Error('RATE_LIMITED');
    throw new Error(errorMsg);
  }

  const data2 = await response.json();
  const content = data2.content?.[0]?.text || '';

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI returned an unrecognisable response format');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    licensePlate: parsed.licensePlate || null,
    plateConfidence: clamp(parsed.plateConfidence ?? 0, 0, 100),
    occupantCount: clamp(parsed.occupantCount ?? 0, 0, 100),
    occupantConfidence: clamp(parsed.occupantConfidence ?? 0, 0, 100),
    violations: Array.isArray(parsed.violations) ? parsed.violations : [],
    rawDescription: parsed.rawDescription || '',
    timestamp: new Date().toISOString(),
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number(val) || 0));
}
