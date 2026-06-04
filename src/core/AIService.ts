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

  private static wantsCanvasAction(prompt: string, blockId?: string): boolean {
    const text = prompt.toLowerCase();
    if (blockId && blockId !== "BACKGROUND_AGENT") {
      return /\b(modifica|cambia|corrige|arregla|edita|refactoriza|optimiza|agrega|quita|renombra)\b/i.test(text);
    }
    return /\b(crea|crear|genera|generar|agrega|agregar|elimina|eliminar|borra|borrar|limpia|limpiar|vincula|conecta|link|modifica|edita|cambia|guarda|organiza|reordena)\b/i.test(text);
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

    const requiresCanvasJson = this.wantsCanvasAction(prompt, blockId);
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
      const rawContent = data.choices?.[0]?.message?.content || "No obtuve respuesta del modelo.";

      const { AIToolbox } = await import("./AIToolbox");
      AIToolbox.init();
      const parsed = AIToolbox.parseToolUseResponse(rawContent);
      let finalMessage = parsed.message || rawContent;
      const toolCalls: AIResponse["toolCalls"] = [];

      if (parsed.toolUse) {
        const success = AIToolbox.executeToolUse(parsed.toolUse);
        toolCalls.push({ name: parsed.toolUse.action, args: parsed.toolUse.params || {} });
        finalMessage += success
          ? `\n*Accion ejecutada correctamente: ${parsed.toolUse.action}*`
          : `\n*No pude ejecutar la accion: ${parsed.toolUse.action}*`;
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
