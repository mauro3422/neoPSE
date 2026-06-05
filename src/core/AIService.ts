import { AIPackage } from "./ContextPacker";
import { validateToolUse, wantsCanvasAction } from "./AIResponseGuardrails";

export interface AIResponse {
  message: string;
  toolCalls?: {
    name: string;
    args: Record<string, any>;
  }[];
}

/**
 * Servicio central para comunicarse con modelos locales compatibles con OpenAI.
 */
export class AIService {
  private static endpoint: string = "http://127.0.0.1:8000/v1/chat/completions";

  public static setEndpoint(url: string) {
    this.endpoint = url;
  }

  private static async repairCanvasResponse(endpoint: string, systemPrompt: string, prompt: string, badResponse: string): Promise<string | null> {
    try {
      const repairPrompt = [
        "Repair the assistant output for NeoPSE.",
        "",
        "Return the corrected final answer only.",
        "If the user request can be executed with the available workspace context, return exactly one valid JSON object with message and tool_use.",
        "If the request cannot be executed safely because required information is missing, return plain text only and do not include JSON or tool_use.",
        "Never output an empty tool_use object.",
        "Escape all quotes and newlines inside JSON strings.",
        "",
        `User request: ${prompt}`,
        "",
        "Invalid previous output:",
        badResponse
      ].join("\n");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          model: "fallback-model",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: repairPrompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.warn("[AIService] No pude reparar la respuesta estructurada:", error);
      return null;
    }
  }

  /**
   * Envia una consulta a la IA incluyendo el contexto completo del mapa.
   */
  public static async sendMessage(
    prompt: string,
    context: AIPackage,
    blockId?: string,
    history?: { role: 'user' | 'ai', content: string }[]
  ): Promise<AIResponse> {
    const { AssistantPrompt, InlinePrompt, BackgroundSynthesizerPrompt } = await import("./PromptBuilder");
    const requiresCanvasJson = wantsCanvasAction(prompt, blockId);
    const responseMode = requiresCanvasJson ? "canvas_action_json" : "tool_awareness";
    let builder;
    if (blockId === "BACKGROUND_AGENT") {
      builder = new BackgroundSynthesizerPrompt(context);
    } else if (blockId) {
      builder = new InlinePrompt(context, blockId, responseMode);
    } else {
      builder = new AssistantPrompt(context, responseMode);
    }

    const systemPrompt = builder.buildSystemPrompt();

    const isHeavy = requiresCanvasJson || prompt.toLowerCase().match(/(codigo|pseint|escribe|programa|algoritmo|funcion|proceso|matriz|vector|arreglo|estructura)/i);
    const targetPort = isHeavy ? 8000 : 8001;
    const endpoints = targetPort === 8000
      ? ["http://127.0.0.1:8000/v1/chat/completions"]
      : ["http://127.0.0.1:8001/v1/chat/completions", "http://127.0.0.1:8000/v1/chat/completions"];

    console.log(`[AIService] Enviando consulta al puerto ${targetPort}`);

    try {
      const body = JSON.stringify({
        model: "fallback-model",
        messages: [
          { role: "system", content: systemPrompt },
          ...(history ? history.map(h => ({
            role: h.role === 'ai' ? 'assistant' as const : 'user' as const,
            content: h.content
          })) : []),
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        ...(requiresCanvasJson ? { response_format: { type: "json_object" } } : {})
      });

      let response: Response | null = null;
      let lastEndpoint = endpoints[0];

      for (const endpoint of endpoints) {
        lastEndpoint = endpoint;
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(90000),
            body
          });

          if (response.ok) break;
          console.warn(`[AIService] ${endpoint} devolvio HTTP ${response.status}`);
        } catch (endpointError) {
          console.warn(`[AIService] No pude conectar con ${endpoint}:`, endpointError);
          response = null;
        }
      }

      if (!response?.ok) {
        throw new Error(`No hubo respuesta valida desde: ${endpoints.join(', ')}`);
      }

      const data = await response.json();
      let rawContent = data.choices?.[0]?.message?.content || "No obtuve respuesta del modelo.";

      const { AIToolbox } = await import("./AIToolbox");
      AIToolbox.init();
      let parsed = AIToolbox.parseToolUseResponse(rawContent);
      if (requiresCanvasJson && (!parsed.isJsonValid || !parsed.toolUse)) {
        const repaired = await this.repairCanvasResponse(lastEndpoint, systemPrompt, prompt, rawContent);
        if (repaired) {
          const repairedParsed = AIToolbox.parseToolUseResponse(repaired);
          if (repairedParsed.isJsonValid || repaired.trim().length > 0) {
            rawContent = repaired;
            parsed = repairedParsed;
          }
        }
      }
      let finalMessage = parsed.message || rawContent;
      const toolCalls: AIResponse["toolCalls"] = [];

      if (parsed.toolUse) {
        const validation = validateToolUse(prompt, blockId, parsed.toolUse);
        if (!validation.ok || !validation.toolUse) {
          return { message: validation.reason || "No ejecute la accion porque no paso la validacion de seguridad." };
        }

        const success = AIToolbox.executeToolUse(validation.toolUse);
        toolCalls.push({ name: validation.toolUse.action, args: validation.toolUse.params || {} });
        finalMessage += success
          ? `\n*Accion ejecutada correctamente: ${validation.toolUse.action}*`
          : `\n*No pude ejecutar la accion: ${validation.toolUse.action}*`;
      } else {
        finalMessage = AIToolbox.parseAndExecute(finalMessage);
      }

      console.log(`[AIService] Respuesta recibida desde ${lastEndpoint}`);

      return {
        message: finalMessage,
        ...(toolCalls.length ? { toolCalls } : {})
      };
    } catch (error) {
      console.error("[AIService] Error al conectar con el modelo local:", error);
      return {
        message: `**Error de conexion:** No se pudo contactar al modelo local en \`${this.endpoint}\`.\n\nInicia el servidor local con \`npm run dev:ai\` o revisa que el runtime de llama.cpp no este bloqueado por Windows.`
      };
    }
  }
}
