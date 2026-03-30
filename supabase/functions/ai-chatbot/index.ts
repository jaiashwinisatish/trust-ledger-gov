import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, userId, role } = await req.json()
    const openAiKey = Deno.env.get('LOVABLE_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!openAiKey) throw new Error('LOVABLE_API_KEY not set')

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Define System Prompt
    const systemPrompt = `You are "GovDoc AI", the official intelligent assistant for the Government Document Management System.
    Your goal is to help users search documents, check status, and understand procedures.
    
    Current User Context:
    - User ID: ${userId}
    - Role: ${role} (Roles are: citizen, officer, admin)
    
    Procedures:
    1. Uploading: Users can upload PDF/Images. AI extracts text and classifies them.
    2. Verification: Officers review documents. Blockchain hashing ensures immutability.
    3. Flagging: If a document is "flagged", it means an anomaly (dummy data, mismatch) was detected.
    4. Access: Citizens see only their docs. Officers/Admins see everything.
    
    Tone: Professional, helpful, concise.
    If you recommend a document, provide its ID clearly. 
    If a document is rejected/flagged, suggest next steps (e.g., re-upload with better quality, contact department).
    `

    // Define Tools for OpenAI
    const tools = [
      {
        type: "function",
        function: {
          name: "search_documents",
          description: "Search for documents by title, ID, or keywords in OCR text.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              category: { type: "string", description: "Optional document category filter" },
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_document_status",
          description: "Get detailed status, AI insights, and audit history for a document by ID.",
          parameters: {
            type: "object",
            properties: {
              documentId: { type: "string", description: "The UUID of the document" },
            },
            required: ["documentId"]
          }
        }
      }
    ]

    // 1. Initial AI Call
    let response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        tools: tools,
        tool_choice: "auto",
      }),
    })

    let data = await response.json()
    let message = data.choices[0].message

    // 2. Handle Tool Calls
    if (message.tool_calls) {
      const toolOutputs = []
      
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name
        const args = JSON.parse(toolCall.function.arguments)
        let output = ""

        if (functionName === "search_documents") {
          let query = supabase.from('documents').select('id, title, status, category, created_at, ocr_text')
          
          if (role === 'citizen') {
            query = query.eq('uploaded_by', userId)
          }

          // Simple text search (title + category + partial ocr)
          const { data: docs } = await query
            .or(`title.ilike.%${args.query}%,category.ilike.%${args.query}%,ocr_text.ilike.%${args.query}%`)
            .limit(5)
          
          output = JSON.stringify(docs || [])
        } 
        else if (functionName === "get_document_status") {
          let query = supabase.from('documents').select('*, audit_logs(*)').eq('id', args.documentId)
          
          if (role === 'citizen') {
            query = query.eq('uploaded_by', userId)
          }

          const { data: doc } = await query.single()
          output = JSON.stringify(doc || { error: "Not found or no permission" })
        }

        toolOutputs.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: output,
        })
      }

      // Final AI Call with Tool Outputs
      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt }, 
            ...messages, 
            message, 
            ...toolOutputs
          ],
        }),
      })

      const finalData = await finalResponse.json()
      return new Response(JSON.stringify(finalData.choices[0].message), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(message), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
