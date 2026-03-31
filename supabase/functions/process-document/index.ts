import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper for SHA-256 Hashing
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentId, filePath, userId, preview = false } = await req.json();
    if (!documentId && !filePath) throw new Error("documentId or filePath is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    let doc = null;
    let currentDocumentId = documentId;

    if (!preview) {
      // 1. Get document for standard processing
      const { data, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (docError || !data) throw new Error("Document not found");
      doc = data;

      // 2. Initial Audit - Start Processing
      const startDetails = JSON.stringify({ action: "processing_started", timestamp: new Date().toISOString() });
      const { data: lastAudit } = await supabase.from("audit_logs").select("hash").order("created_at", { ascending: false }).limit(1).single();
      const prevHash = lastAudit?.hash || "0".repeat(64);
      const currentHash = await generateHash(prevHash + startDetails + doc.id);

      await supabase.from("audit_logs").insert({
        document_id: documentId,
        user_id: doc.uploaded_by,
        action: "processing_started",
        details: JSON.parse(startDetails),
        previous_hash: prevHash,
        hash: currentHash
      });
    } else {
      // Preview mode - just use provided path info
      doc = { file_path: filePath, uploaded_by: userId, file_name: filePath.split("/").pop(), mime_type: "application/octet-stream" };
    }

    // 3. AI Analysis
    let extractedText = "";
    let aiClassification: any = null;
    let confidenceScore = 0;
    let flagged = false;
    let flagReason = null;

    const { data: policySetting } = await supabase
      .from("policy_settings")
      .select("confidence_threshold")
      .eq("name", "default_policy")
      .maybeSingle();

    const policyThreshold = Number(policySetting?.confidence_threshold ?? 70);

    if (lovableKey) {
      const fileInfo = `File: ${doc.file_name}, Type: ${doc.mime_type}, Category: ${doc?.category || "unknown"}, Title: ${doc?.title || "unknown"}`;
      
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `              You are an Advanced AI Document Intelligence Engine for a 5-Step Government Lifecycle:
              STEP 1: OCR Processing (Text Extraction)
              STEP 2: NLP Analysis (Context & Meaning)
              STEP 3: Auto-Metadata Generation (Title, Category, Priority, Department)
              STEP 4: Smart Suggestions (Improvements for organization)
              STEP 5: Human Verification (Final check)
              
              Analyze this document to generate HIGH-INTEGRITY metadata drafts for Step 5 Review.
              
              NEURAL LANGUAGE INTELLIGENCE:
              - Detect the document's primary language (source_lang).
              - If the document is NOT in English, provide a high-fidelity translation (translated_metadata) to English.
              
              Return a clean JSON object:
              {
                "source_lang": "ISO 639-1 code (e.g., 'hi', 'ta', 'es')",
                "detected_language_name": "Full name (e.g., 'Hindi')",
                "extracted_text": "Full OCR text of the document...",
                "document_type": "Specific Type (e.g. Aadhar Card)",
                "suggested_category": "Official category from: birth_certificate, land_record, tax_filing, identity_card, property_deed, court_order, permit, license, other",
                "suggested_title": "Professional, improved title (e.g., Aadhar Identity - [NAME])",
                "priority": "high|normal|low",
                "suggested_department": "Issuing or handling government authority",
                "classification_tips": ["list of organization or filing tips"],
                "extracted_data": { "Field Name": "Value", ... },
                "summary": "2-sentence executive summary in ORIGINAL language...",
                "translated_metadata": {
                   "title": "Translated Title to English",
                   "summary": "Translated Summary to English",
                   "fields": { "Translated Key": "Translated Value", ... }
                },
                "authenticity_check": {
                  "is_authentic": boolean,
                  "risk_score": 0-100,
                  "risks": ["list of signs"],
                  "tamper_heatmap": [{ "x": 0, "y": 0, "w": 0, "h": 0, "type": "type", "reason": "why" }]
                },
                "confidence": 0-100,
                "is_flagged": boolean,
                "needs_translation": boolean
              }`
            },
            { role: "user", content: `PROCESS THIS HIGH-PRIORITY GOVERNMENT RECORD: ${fileInfo}` }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (aiResponse.ok) {
        const result = await aiResponse.json();
        const content = JSON.parse(result.choices[0].message.content);
        
        extractedText = content.extracted_text;
        aiClassification = {
          document_type: content.document_type,
          suggested_category: content.suggested_category,
          suggested_title: content.suggested_title,
          suggested_department: content.suggested_department,
          suggested_priority: content.priority,
          classification_tips: content.classification_tips || [],
          original_user_category: doc.category,
          original_user_title: doc.title,
          extracted_data: content.extracted_data || {},
          summary: content.summary,
          source_lang: content.source_lang,
          detected_language_name: content.detected_language_name,
          translated_metadata: content.translated_metadata,
          needs_translation: content.needs_translation,
          authenticity_check: {
            ...content.authenticity_check,
            tamper_heatmap: content.authenticity_check?.tamper_heatmap || []
          },
          anomalies: content.authenticity_check?.risks || [],
        };
        const computedConfidence = Number(content.confidence ?? content.authenticity_check?.risk_score ?? 0);
        confidenceScore = Number.isFinite(computedConfidence) ? computedConfidence : 0;

        const riskyByAIPolicy = Boolean(content.is_flagged) || !content.authenticity_check?.is_authentic || (Number(content.authenticity_check?.risk_score ?? 0) > 60);
        const riskyByReviewPolicy = confidenceScore < policyThreshold;
        flagged = riskyByAIPolicy || riskyByReviewPolicy;

        const reasons: string[] = [];
        if (content.authenticity_check?.risks?.length) {
          reasons.push(...content.authenticity_check.risks);
        }
        if (riskyByReviewPolicy) {
          reasons.push(`confidence ${confidenceScore} below policy threshold ${policyThreshold}`);
        }
        flagReason = flagged ? (reasons.join("; ") || "Suspected fraud or data manipulation") : null;

        if (preview) {
          return new Response(JSON.stringify({ 
            success: true, 
            preview: true,
            metadata: {
              title: content.suggested_title,
              category: content.suggested_category,
              department: content.suggested_department,
              priority: content.priority,
              confidence: confidenceScore,
              flagged,
              policy_threshold: policyThreshold
            }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // 4. Update document with Step 4 results - TRANSITION TO STEP 5 (Reviewed)
        await supabase.from("documents").update({
          title: content.suggested_title || doc.title,
          category: content.suggested_category || doc.category,
          department: content.suggested_department || doc.department,
          priority: content.priority || doc.priority,
          ocr_text: extractedText || "[OCR Failed] Manual review required.",
          ai_classification: aiClassification,
          confidence_score: confidenceScore || 50,
          flagged,
          flag_reason: flagReason,
          status: flagged ? "flagged" : "reviewed",
        }).eq("id", documentId);
      }
    }


    // 5. Final Audit - Processing Complete (Closing the chain)
    if (!preview && documentId) {
      const endDetails = JSON.stringify({ 
        action: "ai_processing_complete", 
        flagged, 
        confidence: confidenceScore,
        timestamp: new Date().toISOString() 
      });
      
      const { data: lastAudit } = await supabase.from("audit_logs").select("hash").order("created_at", { ascending: false }).limit(1).single();
      const finalPrevHash = lastAudit?.hash || "0".repeat(64);
      const finalHash = await generateHash(finalPrevHash + endDetails + documentId);

      await supabase.from("audit_logs").insert({
        document_id: documentId,
        user_id: doc.uploaded_by,
        action: "ai_processing_complete",
        details: JSON.parse(endDetails),
        previous_hash: finalPrevHash,
        hash: finalHash
      });
    }

    return new Response(JSON.stringify({ success: true, flagged, confidence: confidenceScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

