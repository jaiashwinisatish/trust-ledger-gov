import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { documentId, action, details, userId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get last hash for this chain (overall system chain or document-specific)
    // For a real "blockchain" feel, let's use a global system chain
    const { data: lastAudit } = await supabase
      .from("audit_logs")
      .select("hash")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const prevHash = lastAudit?.hash || "0".repeat(64);
    const logData = JSON.stringify({ documentId, action, details, userId, timestamp: new Date().toISOString() });
    const currentHash = await generateHash(prevHash + logData);

    const { data, error } = await supabase.from("audit_logs").insert({
      document_id: documentId,
      user_id: userId,
      action: action,
      details: details,
      previous_hash: prevHash,
      hash: currentHash
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
