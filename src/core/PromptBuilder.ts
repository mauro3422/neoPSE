import { AIPackage } from "./ContextPacker";
import prompts from "../ai/prompts-ide.json";

export abstract class BasePrompt {
  constructor(protected context: AIPackage) { }

  /**
   * Construye las directrices comunes de comportamiento pedagógico.
   */
  protected getCommonGuidelines(): string {
    return prompts.commonGuidelines;
  }

  protected getToolUseGuidelines(): string {
    return prompts.toolUseGuidelines;
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
    const selectedBlocks = (this.context.allBlocks || this.context.executionSequence).filter(step =>
      this.context.selectedContextIds.includes(step.blockId)
    );

    let template = prompts.assistantPrompt;
    template = template.replaceAll("{globalNotes}", JSON.stringify(this.context.globalNotes));
    template = template.replaceAll("{executionSequence}", JSON.stringify(this.context.executionSequence));
    template = template.replaceAll("{selectedBlocks}", JSON.stringify(selectedBlocks));
    template = template.replaceAll("{commonGuidelines}", this.getCommonGuidelines());
    template = template.replaceAll("{toolUseGuidelines}", this.getToolUseGuidelines());

    return template;
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
    const targetBlock = (this.context.allBlocks || this.context.executionSequence).find(step => step.blockId === this.targetBlockId);
    const blockContent = targetBlock ? targetBlock.content : "Sin contenido cargado";

    let template = prompts.inlinePrompt;

    template = template.replaceAll("{targetBlockId}", this.targetBlockId);
    template = template.replaceAll("{blockContent}", blockContent);
    template = template.replaceAll("{executionSequence}", JSON.stringify(this.context.executionSequence));
    template = template.replaceAll("{commonGuidelines}", this.getCommonGuidelines());
    template = template.replaceAll("{toolUseGuidelines}", this.getToolUseGuidelines());

    return template;
  }
}