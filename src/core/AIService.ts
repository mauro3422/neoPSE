import { AIPackage } from "./ContextPacker";

export interface AIResponse {
  message: string;
  toolCalls?: {
    name: string;
    args: any;
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
    const { AssistantPrompt, InlinePrompt } = await import("./PromptBuilder");
    const builder = blockId 
      ? new InlinePrompt(context, blockId) 
      : new AssistantPrompt(context);
      
    const systemPrompt = builder.buildSystemPrompt();
    console.log("[AIService] 📤 PROMPT ENVIADO A IA:\n", systemPrompt);

    try {
      const response = await fetch(this.endpoint, {
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
          temperature: 0.6
        })
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor de IA: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        message: data.choices?.[0]?.message?.content || "No obtuve respuesta del modelo."
      };
    } catch (error) {
      console.error("[AIService] Error al conectar con el modelo local:", error);
      return {
        message: `⚠️ **Error de Conexión:** No se pudo contactar al modelo local en \`${this.endpoint}\`.\n\n*Asegúrate de que Ollama o LM Studio estén activos y con CORS habilitado.*`
      };
    }
  }
}
