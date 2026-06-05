export interface ToolUse {
  action: string;
  params?: Record<string, any>;
}

export interface ToolValidationResult {
  ok: boolean;
  toolUse?: ToolUse;
  reason?: string;
}

export function wantsCanvasAction(prompt: string, blockId?: string): boolean {
  const text = prompt.toLowerCase();
  if (blockId && blockId !== "BACKGROUND_AGENT") {
    return /\b(modifica|cambia|corrige|arregla|edita|refactoriza|optimiza|agrega|quita|renombra)\b/i.test(text);
  }
  return /\b(crea|crear|genera|generar|agrega|agregar|elimina|eliminar|borra|borrar|limpia|limpiar|vincula|conecta|link|modifica|edita|cambia|guarda|organiza|reordena)\b/i.test(text);
}

export function validateToolUse(prompt: string, blockId: string | undefined, toolUse: ToolUse): ToolValidationResult {
  const text = prompt.toLowerCase();
  const params = toolUse.params || {};
  const content = String(params.content || '').toLowerCase();
  const message = `${String(params.content || '')} ${String(params.title || '')}`.toLowerCase();

  const placeholderPattern = /(esperando|waiting|falta contexto|proporciona|especifica|no tengo|necesito mas|pending|placeholder)/i;
  if (toolUse.action === "create_block" && (!params.content || placeholderPattern.test(message))) {
    return { ok: false, reason: "Necesito mas contexto antes de crear un bloque en el canvas." };
  }

  if ((toolUse.action === "clear_workspace" || toolUse.action === "delete_block") && /\b(cancela|cancelar|cancelo|cancel)\b/i.test(text)) {
    return { ok: false, reason: "Cancelado. No borre ni limpie el workspace porque cancelar no implica eliminar contenido." };
  }

  if (toolUse.action === "clear_workspace" && !/\b(limpia|limpiar|borra todo|borrar todo|elimina todos|eliminar todos|clear workspace|vaciar)\b/i.test(text)) {
    return { ok: false, reason: "No limpie el workspace porque la orden no pidio explicitamente borrar todo." };
  }

  if (toolUse.action === "delete_block" && !/\b(elimina|eliminar|borra|borrar|delete)\b/i.test(text)) {
    return { ok: false, reason: "No borre el bloque porque la orden no pidio explicitamente eliminar." };
  }

  if (blockId && blockId !== "BACKGROUND_AGENT" && toolUse.action === "create_block" && typeof params.content === "string") {
    return {
      ok: true,
      toolUse: {
        action: "edit_block_content",
        params: {
          blockId,
          content: params.content,
          ...(typeof params.title === "string" ? { title: params.title } : {})
        }
      }
    };
  }

  if (blockId && blockId !== "BACKGROUND_AGENT" && toolUse.action !== "edit_block_content") {
    return { ok: false, reason: "Esta accion inline solo puede editar el bloque actual." };
  }

  if (toolUse.action === "edit_block_content" && /\bpara\b[\s\S]*\bhacer\b/i.test(String(params.content || '')) && !/\bfinpara\b/i.test(content)) {
    return { ok: false, reason: "La correccion del bucle Para esta incompleta porque falta FinPara." };
  }

  return { ok: true, toolUse };
}
