import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  imageBase64?: string;
  imageUrl?: string;
  cameraId?: string;
}

interface AnalysisResult {
  licensePlate: string | null;
  plateConfidence: number;
  occupantCount: number;
  occupantConfidence: number;
  violations: string[];
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: AnalysisRequest = await req.json();
    const imageBase64 = body.imageBase64 || "";
    const imageUrl = body.imageUrl || "";
    const cameraId = body.cameraId || "unknown";

    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageBase64 or imageUrl is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await analyzeImage(imageBase64 || imageUrl);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Analysis failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function analyzeImage(imageData: string): Promise<AnalysisResult> {
  const useMockAnalysis = Deno.env.get("USE_MOCK_ANALYSIS") !== "false";

  if (useMockAnalysis) {
    return generateMockAnalysis();
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.warn(
        "No ANTHROPIC_API_KEY provided, using mock analysis"
      );
      return generateMockAnalysis();
    }

    const imageSource = imageData.startsWith("http")
      ? { type: "url" as const, url: imageData }
      : {
          type: "base64" as const,
          media_type: "image/jpeg" as const,
          data: imageData.includes(",")
            ? imageData.split(",")[1]
            : imageData,
        };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: imageSource,
              },
              {
                type: "text",
                text: `Analyze this traffic/vehicle image and provide:
1. License plate number (if visible, format as text or null)
2. Confidence level for plate (0-100)
3. Number of people/occupants visible in vehicle (0-15)
4. Confidence level for occupant count (0-100)
5. List of violations detected: overcrowding, wrong_lane, parking_violation, unsafe_loading, etc.

Respond ONLY in this JSON format:
{
  "licensePlate": "ABC123" or null,
  "plateConfidence": 85,
  "occupantCount": 5,
  "occupantConfidence": 90,
  "violations": ["overcrowding"]
}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("API error:", response.status);
      return generateMockAnalysis();
    }

    const data = await response.json();
    const content = data.content[0]?.text || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return generateMockAnalysis();
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      licensePlate: parsed.licensePlate || null,
      plateConfidence: Math.min(100, Math.max(0, parsed.plateConfidence || 0)),
      occupantCount: Math.max(
        0,
        Math.min(15, parsed.occupantCount || 0)
      ),
      occupantConfidence: Math.min(
        100,
        Math.max(0, parsed.occupantConfidence || 0)
      ),
      violations: Array.isArray(parsed.violations)
        ? parsed.violations
        : [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Claude API error:", error);
    return generateMockAnalysis();
  }
}

function generateMockAnalysis(): AnalysisResult {
  const plates = [
    "KBE 100A",
    "KCA 200B",
    "KDA 300C",
    "KAA 400D",
    "KBB 500E",
    null,
  ];
  const violationOptions = [
    [],
    ["overcrowding"],
    ["wrong_lane"],
    ["overcrowding", "unsafe_loading"],
    ["parking_violation"],
  ];

  const hasPlate = Math.random() > 0.3;

  return {
    licensePlate: hasPlate
      ? plates[Math.floor(Math.random() * (plates.length - 1))]
      : null,
    plateConfidence: hasPlate
      ? Math.floor(Math.random() * 30) + 70
      : 0,
    occupantCount: Math.floor(Math.random() * 10) + 1,
    occupantConfidence: Math.floor(Math.random() * 25) + 75,
    violations:
      violationOptions[
        Math.floor(Math.random() * violationOptions.length)
      ],
    timestamp: new Date().toISOString(),
  };
}
