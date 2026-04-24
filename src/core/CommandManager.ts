export interface Command {
  execute(): void;
  undo(): void;
  redo?(): void;
}

export class CommandManager {
  private static instance: CommandManager;
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  private constructor() {}

  public static getInstance(): CommandManager {
    if (!this.instance) this.instance = new CommandManager();
    return this.instance;
  }

  public execute(command: Command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // Limpiar historial de redo al hacer algo nuevo
  }

  public undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  public redo() {
    const command = this.redoStack.pop();
    if (command) {
      const exec = command.redo || command.execute;
      exec.call(command);
      this.undoStack.push(command);
    }
  }
}

export const commandManager = CommandManager.getInstance();
