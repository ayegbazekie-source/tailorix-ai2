/**
 * TAILORIX AI — SUPABASE EDGE FUNCTION: deconstruct-garment
 * Stage 2.5 Multi-Provider Server-Side AI Gateway
 * 
 * Secure gateway for Gemini, Groq, and optional OpenAI providers.
 * All API keys remain strictly server-side in Supabase Secrets:
 * - GEMINI_API_KEY
 * - GROQ_API_KEY
 * - OPENAI_API_KEY
 * 
 * Never exposes secrets to browser clients.
 * Never allows AI to directly manipulate pattern geometry.
 */

// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SYSTEM_PROMPT } from './prompts/system.ts';
import { buildGarmentAnalysisPrompt } from './prompts/garmentAnalysis.ts';
import { buildConstructionAnalysisPrompt } from './prompts/constructionAnalysis.ts';
import { buildVerificationPrompt } from './prompts/verificationAnalysis.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ImagePayload {
  id: string;
  role?: string;
  mimeType?: string;
  data: string; // base64 or data URI
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are supported.',
        retryable: false,
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const {
      provider = 'gemini',
      taskType = 'full_garment_analysis',
      images: rawImages,
      image: rawSingleImage,
      userInstruction,
      options = {},
      existingSpecification,
      userCorrections,
    } = payload;

    // =========================================================================
    // 1. GROQ PROVIDER (Fast Interactive Text & Pattern Commands)
    // =========================================================================
    if (provider === 'groq') {
      const groqKey = Deno.env.get('GROQ_API_KEY');
      if (!groqKey) {
        console.error('[Tailorix Edge] Missing GROQ_API_KEY environment secret.');
        return new Response(
          JSON.stringify({
            status: 'error',
            code: 'GROQ_KEY_NOT_CONFIGURED',
            message: 'Server-side GROQ_API_KEY secret is not configured in Supabase Edge Functions.',
            retryable: false,
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const model = Deno.env.get('GROQ_MODEL') || options.model || 'llama-3.3-70b-versatile';
      const prompt = `You are the master tailoring command interpreter for Tailorix AI.
The user provides a natural-language tailoring instruction or conversational modification.
Convert it into a structured Tailorix command JSON object.

Supported actions:
1. "modify_measurement": { "action": "modify_measurement", "target": "<target_measurement>", "operation": "add"|"subtract", "value": <number>, "unit": "in"|"cm" }
2. "remove_component": { "action": "remove_component", "target": "<component_name>" }
3. "replace_component": { "action": "replace_component", "target": "<target_component>", "replacement": "<replacement_type>" }
4. "add_component": { "action": "add_component", "component": "<component_name>" }

User Instruction: "${userInstruction || ''}"

Return ONLY a JSON object with keys:
{
  "command": { "action": "...", ... },
  "explanation": "Brief explanation of interpreted intent"
}`;

      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You output only valid JSON.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      if (!groqResponse.ok) {
        const errBody = await groqResponse.text();
        console.error(`[Tailorix Edge] Groq API returned HTTP ${groqResponse.status}: ${errBody}`);
        return new Response(
          JSON.stringify({
            status: 'error',
            code: groqResponse.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE',
            message: `Groq error: ${errBody}`,
            retryable: groqResponse.status === 429,
          }),
          { status: groqResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const groqData = await groqResponse.json();
      const content = groqData.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content || '{}');

      return new Response(
        JSON.stringify({
          success: true,
          provider: 'groq',
          model,
          command: parsed.command,
          explanation: parsed.explanation,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 2. IMAGE PREPARATION FOR VISION PROVIDERS (Gemini / OpenAI)
    // =========================================================================
    const normalizedImages: ImagePayload[] = [];
    if (Array.isArray(rawImages) && rawImages.length > 0) {
      rawImages.forEach((img: any, idx: number) => {
        if (!img) return;
        if (typeof img === 'string') {
          normalizedImages.push({
            id: `img_${idx + 1}`,
            role: idx === 0 ? 'front' : 'detail',
            mimeType: img.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
            data: img,
          });
        } else if (typeof img === 'object' && img.data) {
          normalizedImages.push({
            id: img.id || `img_${img.role || 'view'}_${idx + 1}`,
            role: img.role || 'unknown',
            mimeType: img.mimeType || 'image/jpeg',
            data: img.data,
          });
        }
      });
    } else if (rawSingleImage) {
      const dataStr = typeof rawSingleImage === 'string' ? rawSingleImage : rawSingleImage.data;
      if (dataStr) {
        normalizedImages.push({
          id: 'img_front_01',
          role: 'front',
          mimeType: dataStr.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
          data: dataStr,
        });
      }
    }

    if (normalizedImages.length === 0 && !userInstruction) {
      return new Response(
        JSON.stringify({
          status: 'error',
          code: 'NO_IMAGE_PROVIDED',
          message: 'At least one garment reference image is required for deconstruction.',
          retryable: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select prompt based on analysis mode
    const mode = options.mode || 'full';
    const imageMetadata = normalizedImages.map((img) => ({ id: img.id, role: img.role || 'unknown' }));

    let userInstructionText = '';
    if (mode === 'construction') {
      userInstructionText = buildConstructionAnalysisPrompt({ existingSpecification, userCorrections, imageMetadata });
    } else if (mode === 'verification') {
      userInstructionText = buildVerificationPrompt({
        targetField: options.targetField,
        specificQuestion: options.specificQuestion,
        existingSpecification,
        userCorrections,
        imageMetadata,
      });
    } else {
      userInstructionText = buildGarmentAnalysisPrompt({ mode, existingSpecification, userCorrections, imageMetadata });
    }

    // =========================================================================
    // 3. GEMINI PROVIDER (Primary Multi-Modal Vision)
    // =========================================================================
    if (provider === 'gemini') {
      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      if (!geminiKey) {
        console.error('[Tailorix Edge] Missing GEMINI_API_KEY environment secret.');
        return new Response(
          JSON.stringify({
            status: 'error',
            code: 'GEMINI_KEY_NOT_CONFIGURED',
            message: 'Server-side GEMINI_API_KEY secret is not configured in Supabase Edge Functions.',
            retryable: false,
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const model = Deno.env.get('GEMINI_MODEL') || options.model || 'gemini-3.8-flash';
      console.info(`[Tailorix Edge] Invoking Gemini model "${model}" with ${normalizedImages.length} images.`);

      // Assemble Gemini contents
      const parts: any[] = [{ text: `${SYSTEM_PROMPT}\n\n${userInstructionText}` }];

      for (const img of normalizedImages) {
        let cleanBase64 = img.data;
        if (cleanBase64.includes('base64,')) {
          cleanBase64 = cleanBase64.split('base64,')[1];
        }
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.15,
          },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error(`[Tailorix Edge] Gemini API returned HTTP ${geminiRes.status}: ${errText}`);
        return new Response(
          JSON.stringify({
            status: 'error',
            code: geminiRes.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE',
            message: `Gemini API error: ${errText}`,
            retryable: geminiRes.status === 429,
          }),
          { status: geminiRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const geminiData = await geminiRes.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText || '{}');

      return new Response(
        JSON.stringify({
          success: true,
          provider: 'gemini',
          model,
          specification: parsed.specification || parsed,
          observations: parsed.observations || [],
          confidence: parsed.confidence ?? 0.95,
          uncertainties: parsed.uncertainties || [],
          assumptions: parsed.assumptions || [],
          questionsForUser: parsed.questionsForUser || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 4. OPENAI PROVIDER (Optional Future Gateway)
    // =========================================================================
    if (provider === 'openai') {
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        console.error('[Tailorix Edge] Missing OPENAI_API_KEY environment secret.');
        return new Response(
          JSON.stringify({
            status: 'error',
            code: 'OPENAI_KEY_NOT_CONFIGURED',
            message: 'Server-side OPENAI_API_KEY secret is not configured in Supabase Edge Functions.',
            retryable: false,
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const model = Deno.env.get('OPENAI_MODEL') || options.model || 'gpt-4o';
      const userContentParts: any[] = [{ type: 'text', text: userInstructionText }];

      for (const img of normalizedImages) {
        let url = img.data;
        if (!url.startsWith('data:')) {
          url = `data:${img.mimeType || 'image/jpeg'};base64,${img.data}`;
        }
        userContentParts.push({
          type: 'image_url',
          image_url: { url, detail: 'high' },
        });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContentParts },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.15,
          max_tokens: 3800,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({
            status: 'error',
            code: response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE',
            message: `OpenAI error: ${errorText}`,
            retryable: response.status === 429,
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content || '{}');

      return new Response(
        JSON.stringify({
          success: true,
          provider: 'openai',
          model,
          specification: parsed.specification || parsed,
          observations: parsed.observations || [],
          confidence: parsed.confidence ?? 0.95,
          uncertainties: parsed.uncertainties || [],
          assumptions: parsed.assumptions || [],
          questionsForUser: parsed.questionsForUser || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'UNSUPPORTED_PROVIDER',
        message: `Provider "${provider}" is not recognized by the edge gateway.`,
        retryable: false,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Tailorix Edge] Unhandled Exception:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred during AI deconstruction.',
        retryable: true,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
