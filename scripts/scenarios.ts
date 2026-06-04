export type ScenarioResponse = 'assistant_text' | 'canvas_action_json';

export interface ScenarioTestCase {
  name: string;
  q: string;
  type: 'assistant' | 'inline';
  category: 'logic' | 'syntax' | 'conversational';
  expectedResponse: ScenarioResponse;
  expectedAction?: string;
  expectedKeywords?: string[];
}

export const SCENARIOS: ScenarioTestCase[] = [
  // Grupo A: Conversacional puro
  { name: 'H01-Saludo', q: 'Hola, como estas?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H02-Que-Es-Bucle', q: 'Que es un bucle?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text', expectedKeywords: ['bucle'] },
  { name: 'H03-Mientras-Para', q: 'Cual es la diferencia entre un bucle Mientras y un bucle Para?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text', expectedKeywords: ['Mientras', 'Para'] },
  { name: 'H04-Ayuda-Principiante', q: 'No entiendo nada de programacion, me ayudas?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H05-Cielo', q: 'De que color es el cielo?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H06-Metafora-Pila', q: 'Quiero una metafora para entender que es una Pila (Stack).', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text', expectedKeywords: ['pila'] },
  { name: 'H07-Pseudocodigo', q: 'Por que usamos pseudocodigo en lugar de codigo real?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text', expectedKeywords: ['pseudocodigo'] },
  { name: 'H08-Exportar', q: 'Que lenguajes puedo exportar desde aqui?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H09-Complejidad', q: 'Explicame que significa la complejidad algoritmica O(N).', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text', expectedKeywords: ['O(N)'] },
  { name: 'H10-Definir', q: 'Para que sirve la palabra clave Definir?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text', expectedKeywords: ['Definir'] },
  { name: 'H11-Depurar', q: 'Dame consejos sobre como depurar codigo manualmente.', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H12-Musica', q: 'Te gusta la musica?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H13-Resumen', q: 'Hazme un resumen de lo que llevo aprendido.', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H14-Despedida', q: 'Adios, gracias por todo!', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H15-Recursion', q: 'Que es una funcion recursiva?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text', expectedKeywords: ['recurs'] },

  // Grupo B: Logica y lienzo
  { name: 'H16-Area-Circulo', q: 'Crea un bloque de pseudocodigo que calcule el area de un circulo pidiendole el radio al usuario.', type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['Algoritmo', 'radio'] },
  { name: 'H17-Modificar-Valor', q: 'Modifica el bloque node-1 para cambiar el valor inicial a 100.', type: 'inline', category: 'syntax', expectedResponse: 'canvas_action_json', expectedAction: 'edit_block_content', expectedKeywords: ['100'] },
  { name: 'H18-Conectar-Directo', q: 'Conecta el bloque node-1 con el bloque node-2 mediante un enlace directo.', type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'link_blocks' },
  { name: 'H19-Limpiar-Workspace', q: 'Limpia el espacio de trabajo eliminando todos los bloques existentes.', type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'clear_workspace' },
  { name: 'H20-Matriz-Tateti', q: 'Disena una matriz bidimensional 3x3 para un juego de Tres en Linea (Tic-Tac-Toe).', type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['matriz'] },
  { name: 'H21-Insertion-Sort', q: 'Escribe un algoritmo de ordenamiento por insercion (Insertion Sort) en PSeInt.', type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['Algoritmo'] },
  { name: 'H22-Menu-Repetir', q: 'Crea un menu interactivo con opciones: 1. Sumar, 2. Restar, 3. Salir usando un bucle Repetir.', type: 'assistant', category: 'syntax', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['Repetir'] },
  { name: 'H23-Torres-Hanoi', q: 'Crea una funcion recursiva para resolver el problema de las Torres de Hanoi para N discos.', type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['Hanoi'] },
  { name: 'H24-Nota-QuickSort', q: 'Agrega una nota en el lienzo explicando la complejidad algoritmica de QuickSort.', type: 'assistant', category: 'conversational', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['QuickSort'] },
  { name: 'H25-Anio-Bisiesto', q: 'Escribe un algoritmo para determinar si un anio ingresado por el usuario es bisiesto.', type: 'assistant', category: 'syntax', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['bisiesto', 'Algoritmo'] },
  { name: 'H26-Cola-Banco', q: 'Simula el flujo de una cola de banco donde los clientes entran y salen secuencialmente.', type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['cola'] },
  { name: 'H27-Busqueda-Lineal', q: 'Implementa el algoritmo de busqueda lineal para encontrar un numero dentro de un arreglo.', type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['arreglo'] },
  { name: 'H28-Inline-Fin-Proceso', q: "Modifica el bloque node-1 para agregar una instruccion que imprima 'Fin del Proceso'.", type: 'inline', category: 'syntax', expectedResponse: 'canvas_action_json', expectedAction: 'edit_block_content', expectedKeywords: ['Fin del Proceso'] },
  { name: 'H29-Conectar-Secuencial', q: 'Conecta el bloque node-1 con node-2 para guiar la ejecucion logica secuencial.', type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'link_blocks' },
  { name: 'H30-Carpeta-ED', q: "Crea una carpeta llamada 'Estructuras de Datos' para organizar los modulos.", type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['Estructuras de Datos'] },

  // Grupo C: Refactorizacion dinamica
  { name: 'H31-Optimizar-Para', q: 'Optimiza un bucle Para existente en el lienzo.', type: 'inline', category: 'syntax', expectedResponse: 'assistant_text' },
  { name: 'H32-Renombrar-Variables', q: 'Cambia los nombres de variables en el nodo-1.', type: 'inline', category: 'syntax', expectedResponse: 'canvas_action_json', expectedAction: 'edit_block_content' },
  { name: 'H33-Validacion-Entradas', q: 'Agrega validacion de entradas a un algoritmo existente.', type: 'assistant', category: 'logic', expectedResponse: 'canvas_action_json', expectedAction: 'create_block', expectedKeywords: ['valid'] },
  { name: 'H34-Convertir-Mientras-Para', q: 'Convierte un bucle Mientras a un bucle Para.', type: 'inline', category: 'syntax', expectedResponse: 'assistant_text' },
  { name: 'H35-Auto-Layout', q: 'Ubica visualmente un bloque flotante.', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H36-Extraer-Modulo', q: 'Extrae una porcion de codigo a un nuevo bloque modular.', type: 'assistant', category: 'logic', expectedResponse: 'assistant_text' },
  { name: 'H37-Fusionar-Bloques', q: 'Fusiona dos bloques logicos en uno solo.', type: 'assistant', category: 'logic', expectedResponse: 'assistant_text' },
  { name: 'H38-Comentarios-Inline', q: 'Agrega comentarios explicativos dentro del bloque node-1.', type: 'inline', category: 'conversational', expectedResponse: 'canvas_action_json', expectedAction: 'edit_block_content' },
  { name: 'H39-Cambiar-Tipo', q: 'Cambia el tipo de bloque de nota a pseudocodigo.', type: 'inline', category: 'syntax', expectedResponse: 'canvas_action_json', expectedAction: 'edit_block_content' },
  { name: 'H40-Reajustar-Enlaces', q: 'Reajusta los enlaces logicos de ejecucion de los bloques.', type: 'assistant', category: 'logic', expectedResponse: 'assistant_text' },

  // Grupo D: Casos borde y errores
  { name: 'H41-Codigo-Roto-Para', q: 'Corrige este codigo roto: Para i=1 Hasta 10 Hacer', type: 'inline', category: 'syntax', expectedResponse: 'canvas_action_json', expectedAction: 'edit_block_content', expectedKeywords: ['FinPara'] },
  { name: 'H42-Infinito', q: 'Calcula el infinito mediante un algoritmo.', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H43-Bucle-Infinito', q: 'Tengo un bucle infinito en mi codigo, ayudame a encontrarlo.', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text', expectedKeywords: ['bucle'] },
  { name: 'H44-Comilla', q: 'Se me olvido cerrar una comilla en este texto.', type: 'inline', category: 'syntax', expectedResponse: 'assistant_text' },
  { name: 'H45-Division-Cero', q: 'Que pasa si divido un numero por cero en PSeInt?', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text', expectedKeywords: ['cero'] },
  { name: 'H46-Abstracto', q: 'Haz algo abstracto con el nodo-1.', type: 'inline', category: 'conversational', expectedResponse: 'canvas_action_json', expectedAction: 'edit_block_content' },
  { name: 'H47-Borrar-Eliminado', q: 'Quiero borrar un bloque que ya elimine antes del lienzo.', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H48-Sumar-Texto-Numero', q: 'Estoy intentando sumar texto y un numero por error.', type: 'inline', category: 'syntax', expectedResponse: 'assistant_text' },
  { name: 'H49-Cancelar-Generacion', q: 'Cancela la orden de generacion de bloques actual.', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' },
  { name: 'H50-Examen', q: 'Dame la solucion directa del examen sin explicarme nada.', type: 'assistant', category: 'conversational', expectedResponse: 'assistant_text' }
];
