import { AIPackage } from "./ContextPacker";

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
    let builder;
    if (blockId === "BACKGROUND_AGENT") {
      builder = new BackgroundSynthesizerPrompt(context);
    } else if (blockId) {
      builder = new InlinePrompt(context, blockId);
    } else {
      builder = new AssistantPrompt(context);
    }

    const systemPrompt = builder.buildSystemPrompt();

    const isHeavy = prompt.toLowerCase().match(/(crea|elimina|genera|vincula|link|haz|modifica|hazme|codigo|pseint|escribe|programa|algoritmo|funcion|proceso|matriz|vector|arreglo|estructura|optimiza|refactoriza|corrige)/i);
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
        temperature: 0.2
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
      const rawContent = data.choices?.[0]?.message?.content || "No obtuve respuesta del modelo.";

      let finalMessage = rawContent;
      let toolPayload: string | null = null;

      try {
        let jsonStr = rawContent;
        jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();

        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(jsonStr);
        if (parsed.message) {
          finalMessage = parsed.message;
        }
        if (parsed.tool_use) {
          toolPayload = JSON.stringify({ tool_use: parsed.tool_use });
        }
      } catch {
        // El modelo tambien puede responder texto plano.
      }

      const { AIToolbox } = await import("./AIToolbox");
      AIToolbox.init();

      if (toolPayload) {
        AIToolbox.parseAndExecute(toolPayload);
        finalMessage += "\n*Accion ejecutada correctamente*";
      } else {
        finalMessage = AIToolbox.parseAndExecute(finalMessage);
      }

      console.log(`[AIService] Respuesta recibida desde ${lastEndpoint}`);

      return {
        message: finalMessage
      };
    } catch (error) {
      console.error("[AIService] Error al conectar con el modelo local:", error);
      return {
        message: `**Error de conexion:** No se pudo contactar al modelo local en \`${this.endpoint}\`.\n\nInicia el servidor local con \`npm run dev:ai\` o revisa que el runtime de llama.cpp no este bloqueado por Windows.`
      };
    }
  }
}
