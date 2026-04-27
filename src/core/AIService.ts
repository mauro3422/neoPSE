import { AIPackage } from "./ContextPacker";

export interface AIResponse {
  message: string;
  toolCalls?: {
    name: string;
    args: Record<string, any>;
  }[];
}

/**
 * Servicio central para comunicarse con Modelos de Lenguaje Locales (Ollama / LM Studio).
 */
export class AIService {
  private static endpoint: string = "http://127.0.0.1:8000/v1/chat/completions"; // Llama Server de OmnySystem port 8000

  public static setEndpoint(url: string) {
    this.endpoint = url;
  }

  /**
   * Envía una consulta a la IA incluyendo el contexto completo del mapa.
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
    
    // ROUTER SEMÁNTICO INTELIGENTE (CPU/GPU)
    const isHeavy = prompt.toLowerCase().match(/(crea|elimina|genera|vincula|link|haz|modifica|hazme|codigo|pseint|escribe|programa|algoritmo|funcion|proceso|matriz|vector|arreglo|estructura|optimiza|refactoriza|corrige)/i);
    const targetPort = isHeavy ? 8000 : 8001;
    const activeEndpoint = `http://127.0.0.1:${targetPort}/v1/chat/completions`;

    console.log(`[AIService] 📤 Enviando consulta al Puerto ${targetPort}`);

    try {
      const response = await fetch(activeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor de IA: ${response.statusText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || "No obtuve respuesta del modelo.";
      
      let finalMessage = rawContent;
      let toolPayload: string | null = null;

      try {
        let jsonStr = rawContent;
        // Quitar bloques markdown ```json ... ```
        jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
        
        // Buscar primer { y último }
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
      } catch (e) {
        // Fallback texto plano
      }

      const { AIToolbox } = await import("./AIToolbox");
      AIToolbox.init();
      
      if (toolPayload) {
        AIToolbox.parseAndExecute(toolPayload);
        finalMessage += `\n⚡ *[Acción ejecutada correctamente]*`;
      } else {
        finalMessage = AIToolbox.parseAndExecute(finalMessage);
      }

      return {
        message: finalMessage
      };
    } catch (error) {
      console.error("[AIService] Error al conectar con el modelo local:", error);
      return {
        message: `⚠️ **Error de Conexión:** No se pudo contactar al modelo local en \`${this.endpoint}\`.\n\n*Asegúrate de que Ollama o LM Studio estén activos y con CORS habilitado.*`
      };
    }
  }
}
