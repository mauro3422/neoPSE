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
  private static endpoint: string = "http://localhost:11434/v1/chat/completions"; // Compatible con OpenAI / Ollama v1

  public static setEndpoint(url: string) {
    this.endpoint = url;
  }

  /**
   * Envía una consulta a la IA incluyendo el contexto completo del mapa.
   */
  public static async sendMessage(prompt: string, context: AIPackage): Promise<AIResponse> {
    const systemPrompt = `Eres NeoPSE AI, el copiloto pedagógico del entorno NeoPSE.
Tu tarea es ayudar al alumno a estructurar su pensamiento lógico y escribir algoritmos en pseudocódigo.

Contexto actual del Workspace:
- Notas globales: ${JSON.stringify(context.globalNotes)}
- Secuencia de ejecución: ${JSON.stringify(context.executionSequence)}
- ¿Tiene implementación lógica?: ${context.hasImplementation ? "Sí" : "No"}
- Bloques seleccionados prioritarios: ${JSON.stringify(context.selectedContextIds)}

Instrucciones:
1. Responde de forma clara y amigable.
2. Si el usuario te pide generar código, utiliza un lenguaje estructurado (estilo PSeInt).
3. Sé pedagógico: no des la solución completa a menos que te la pidan. Haz preguntas guía.`;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "fallback-model", 
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
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
