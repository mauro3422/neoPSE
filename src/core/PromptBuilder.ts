import { AIPackage } from "./ContextPacker";

export abstract class BasePrompt {
  constructor(protected context: AIPackage) {}

  /**
   * Construye las directrices comunes de comportamiento pedagógico.
   */
  protected getCommonGuidelines(): string {
    return `
Instrucciones obligatorias:
1. Responde de forma clara, amigable y muy estructurada.
2. Si generas código, utiliza pseudocódigo en español (estilo PSeInt).
3. Sé pedagógico: no regales la respuesta completa, guía al estudiante mediante preguntas lógicas.
`;
  }

  /**
   * Retorna el System Prompt final que se le pasará al LLM.
   */
  public abstract buildSystemPrompt(): string;
}

/**
 * Prompt para el Asistente General (Sidebar / Bloque Asistente)
 * Tiene visión global del espacio de trabajo.
 */
export class AssistantPrompt extends BasePrompt {
  public buildSystemPrompt(): string {
    const selectedBlocks = this.context.executionSequence.filter(step => 
      this.context.selectedContextIds.includes(step.blockId)
    );

    return `Eres NeoPSE Assistant, un tutor pedagógico integrado en un entorno visual interactivo de desarrollo.
Estás operando dentro de una aplicación donde el alumno arrastra bloques y escribe pseudocódigo.
A veces el alumno te enviará bloques específicos a tu panel de contexto para que los evalúes.

Contexto del Workspace:
- Notas Globales: ${JSON.stringify(this.context.globalNotes)}
- Orden lógico de ejecución: ${JSON.stringify(this.context.executionSequence)}
- Bloques de Interés (Seleccionados): ${JSON.stringify(selectedBlocks)}
- Implementación lógica actual: ${this.context.hasImplementation ? "Sí" : "No"}

Tu objetivo es analizar el algoritmo general, detectar errores estructurales, sugerir nuevos bloques y ayudar a conectar ideas complejas.
${this.getCommonGuidelines()}`;
  }
}

/**
 * Prompt para el Asistente Inline (Mini-Chat atado a un Bloque)
 * Su contexto está fuertemente acotado a la pieza actual.
 */
export class InlinePrompt extends BasePrompt {
  private targetBlockId: string;

  constructor(context: AIPackage, targetBlockId: string) {
    super(context);
    this.targetBlockId = targetBlockId;
  }

  public buildSystemPrompt(): string {
    const targetBlock = this.context.executionSequence.find(step => step.blockId === this.targetBlockId);
    const blockContent = targetBlock ? targetBlock.content : "Sin contenido cargado";

    return `Eres NeoPSE Inline AI. Estás operando como copiloto específico para el Bloque ID: [${this.targetBlockId}].

Contenido actual del Bloque:
"${blockContent}"

Tu misión se limita estrictamente a asistir con la lógica de este bloque en particular.
No debes divagar sobre el lienzo completo a menos que tenga relación directa.

Puedes:
1. Explicar qué hace la pieza lógica.
2. Ayudar a editar el pseudocódigo interno del bloque.
3. Reformular la idea para mejorar el flujo.

${this.getCommonGuidelines()}`;
  }
}
