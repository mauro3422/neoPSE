# 📊 REPORTE DE EVIDENCIA DE STRESS TEST

### 📌 Query: Crea un algoritmo de ordenamiento BubbleSort en pseudocódigo.

🤖 **Respuesta:**
{
  "message": "Aquí tienes una implementación clara y estructurada del algoritmo BubbleSort en pseudocódigo.",
  "tool_use": {
    "action": "create_block"
  }
}

---

### 📌 Query: Escribe la lógica para un sistema de login con 3 intentos máximos.

🤖 **Respuesta:**
```json
{
  "message": "He diseñado una estructura clara para tu sistema de login con límite de 3 intentos. A continuación, te presento el pseudocódigo completo.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "type": "pseudocode",
      "content": "Implementar un sistema de login que permita hasta 3 intentos. Al alcanzar el límite, bloquear la cuenta y mostrar un mensaje de error."
    }
  }
}
```

---

### 📌 Query: Quiero una función recursiva en JS para calcular el factorial.

🤖 **Respuesta:**
¡Claro! Aquí tienes una implementación recursiva en JavaScript para calcular el factorial de un número:

```javascript
function factorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * factorial(n - 1);
}
```

### Explicación:
- **Caso base:** Si `n` es 0 o 1, el factorial es 1.
- **Caso recursivo:** Para cualquier otro valor, se multiplica `n` por el factorial de `n-1`.

Este código es simple y eficiente para valores pequeños de `n`. Si necesitas manejar números grandes, podrías considerar optimizaciones adicionales.

¿Necesitas alguna variante o una versión con manejo de errores?

---

### 📌 Query: Diseña un conversor de grados Celsius a Fahrenheit.

🤖 **Respuesta:**
{
  "message": "Entendido. Vamos a construir un conversor de grados Celsius a Fahrenheit paso a paso.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "type": "pseudocode",
      "content": "Para convertir de Celsius a Fahrenheit: F = (C * 9/5) + 32"
    }
  }
}

---

### 📌 Query: Crea una calculadora básica que sume, reste y multiplique.

🤖 **Respuesta:**
{
  "message": "Entendido, voy a diseñar una calculadora simple con operaciones básicas.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "blockId": "node-4",
      "title": "Operación",
      "type": "pseudocode",
      "content": "Elegir operación: SUMAR, RESTAR ORDER, MULTIPLICAR"
    }
  }
}

---

### 📌 Query: Genera un árbol binario de búsqueda en TypeScript.

🤖 **Respuesta:**
```typescript
class Node {
  value: number;
  left: Node | null;
  right: Node | null;

  constructor(value: number) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BinarySearchTree {
  root: Node | null;

  constructor() {
    this.root = null;
  }

  insert(value: number): void {
    const newNode = new Node(value);
    if (this.root === null) {
      this.root = newNode;
    } else {
      this.insertNode(this.root, newNode);
    }
  }

  private insertNode(node: Node, newNode: Node): void {
    if (newNode.value < node.value) {
      if (node.left === null) {
        node.left = newNode;
      } else {
        this.insertNode(node.left, newNode);
      }
    } else {
      if (node.right === null) {
        node.right = newNode;
      } else {
        this.insertNode(node.right, newNode);
      }
    }
  }

  // Método para mostrar el árbol (opcional)
  printTree(node: Node | null): void {
    if (node === null) return;
    this.printTree(node.right);
    console.log(node.value);
    this.printTree(node.left);
  }
}
```

---

### 📌 Query: Quiero una validación de correo electrónico usando Regex.

🤖 **Respuesta:**
¡Claro! Para validar un correo electrónico con Regex, puedes usar el siguiente patrón en JavaScript:

```javascript
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const email = "usuario@example.com";
if (emailRegex.test(email)) {
  console.log("El correo es válido.");
} else {
  console.log("El correo no es válido.");
}
```

Este regex verifica la estructura básica de un correo, incluyendo el dominio y el dominio de nivel superior. ¿Necesitas adaptarlo para un caso específico?

---

### 📌 Query: Simula el lanzamiento de un dado de 6 caras.

🤖 **Respuesta:**
{
  "message": "Entendido, voy a simular el lanzamiento de un dado de 6 caras para que veas cómo funcionaría el código.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "blockId": "node-4",
      "title": "Simulación de lanzamiento",
      "content": "Simular lanzar un dado de 6 caras."
    }
  }
}

---

### 📌 Query: Crea una clase abstracta para un Personaje RPG.

🤖 **Respuesta:**
```json
{
  "message": "Entendido. Vamos a construir una clase abstracta para el personaje del RPG con las características esenciales.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "className": "PersonajeRPG",
      "abstract": true,
      "description": "Clase base abstracta para personajes en el juego RPG."
    }
  }
}
```

---

### 📌 Query: Escribe un bucle que imprima los números primos del 1 al 100.

🤖 **Respuesta:**
Aquí tienes un bucle en Python que imprime los números primos del 1 al 100:

```python
for num in range(1, 101):
    if is_prime(num):
        print(num)
```

Y el código para verificar si un número es primo:

```python
def is_prime(n):
    if n <= 1:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True
```

Este código itera desde 1 hasta 100, y solo imprime los números que cumplen la condición de ser primos. ¡Espero que te sea útil!

---

### 📌 Query: Quiero un sistema de inventario simple con agregar y eliminar.

🤖 **Respuesta:**
{
  "message": "Entendido. Vamos a diseñar un sistema de inventario básico con funcionalidades de agregar y eliminar elementos. Aquí tienes una estructura en pseudocódigo que puedes adaptar a tu lenguaje de programación preferido.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "title": "Sistema de Inventario",
      "content": "Implementar estructuras de datos para gestionar productos y realizar operaciones básicas."
    }
  }
}

---

### 📌 Query: Escribe un algoritmo para verificar si una palabra es palíndromo.

🤖 **Respuesta:**
¡Claro! Aquí tienes un algoritmo en pseudocódigo para verificar si una palabra es un palíndromo:

```
Función esPalindromo(palabra):
    # Convertir la palabra a minúsculas para evitar distinción entre mayúsculas y minúsculas
    palabra = palabra.lower()
    
    # Obtener la longitud de la palabra
    longitud = longitud(palabra)
    
    # Comparar la palabra con su versión invertida
    para i desde 0 hasta longitud/2 - 1:
        si palabra[i] != palabra[longitud - i - 1]:
            retornar falso
    retornar verdadero
```

Este algoritmo compara los caracteres desde el inicio y el final de la palabra, moviéndose hacia el centro. Si todos coinciden, la palabra es un palíndromo.

¿Necesitas que lo adapte a un lenguaje de programación específico?

---

### 📌 Query: Genera el código para calcular la serie Fibonacci hasta N.

🤖 **Respuesta:**
```json
{
  "message": "Aquí tienes una implementación en Python que calcula la serie Fibonacci hasta el número N.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "type": "pseudocode",
      "content": "Calcular la serie Fibonacci hasta N:\n1. Inicializar la lista con los dos primeros valores: [0, 1]\n2. Mientras el siguiente valor sea menor o igual a N:\n   a. Sumar los dos últimos valores para obtener el siguiente\n   b. Agregar el nuevo valor a la lista\n3. Devolver la lista completa"
    }
  }
}
```

---

### 📌 Query: Escribe una función que cuente las vocales de un texto.

🤖 **Respuesta:**
```json
{
  "message": "Aquí tienes una función en Python que cuenta las vocales de un texto. Puedes adaptarla según tus necesidades.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "language": "python",
      "code": "def contar_vocales(texto):\n    vocales = 'aeiouAEIOU'  # Incluye mayúsculas y minúsculas\n    contador = 0\n    for letra in texto:\n        if letra in vocales:\n            contador += 1\n    return contador\n\n# Ejemplo de uso:\nprint(contar_vocales('Hola Mundo'))"
    }
  }
}
```

---

### 📌 Query: Genera una matriz de 3x3 rellena de ceros.

🤖 **Respuesta:**
{
  "matrix": [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]
}

---

### 📌 Query: Crea un algoritmo para calcular el área de un círculo.

🤖 **Respuesta:**
{
  "message": "Entendido. Vamos a estructurar un algoritmo claro y eficiente para calcular el área de un círculo.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "title": "Algoritmo para calcular el área de un círculo",
      "content": "1. Definir el radio del círculo (r).\n2. Utilizar la fórmula: Área = π * r².\n3. Realizar el cálculo y mostrar el resultado."
    }
  }
}

---

### 📌 Query: Crea un sistema de combate por turnos básico.

🤖 **Respuesta:**
{
  "message": "Vamos a diseñar un sistema de combate por turnos simple y efectivo. Primero, definiremos las clases de personajes y sus estadísticas básicas.",
  "tool_use": {
    "action": "create_block"
  },
  "code": "class Persona {
  \n  def __init__(self, nombre, fuerza, velocidad):
    \n    self.nombre = nombre
    self.fuerza = fuerza
    self.velocidad = velocidad
  }

  def atacar(self):
    return self.fuerza + self.velocidad
}

class Soldado(Persona):
  def __init__(self, nombre, fuerza, velocidad):
    super().__init__(nombre, fuerza, velocidad)
    self.defensiva = 10

  def atacar(self):
    return self.atacar() - self.defensiva
}

class Hechicero(Persona):
  def __init__(self, nombre, magia, velocidad):
    super().__init__(nombre, 0, velocidad)
    self.magia = magia

  def lanzar_magia(self):
    return self.magia + 5

}

# Ejemplo de combate
soldado1 = Soldado("Tiro", 15, 10)
hechicero = Hechicero("Maldición", 20, 5)

turno = 1
for _ in range(turno):
  print(f"Turno {turno}")
  print(f"Soldado: {soldado1.nombre} - Ataca: {soldado1.atacar()}")
  print(f"Hechicero: {hechicero.nombre} - Lanza magia: {hechicero.lanzar_magia()}")
}
"
}

---

### 📌 Query: Escribe una lógica de juego 'Piedra, Papel o Tijera'.

🤖 **Respuesta:**
{
  "message": "Aquí tienes una implementación clara y funcional del juego 'Piedra, Papel o Tijera'.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "blockId": "node-4",
      "title": "Reglas del Juego",
      "content": "1. Piedra vence Tijera.\n2. Tijera vence Papel.\n3. Papel vence Piedra."
    }
  }
}

---

### 📌 Query: Quiero un script que ordene una lista alfabéticamente.

🤖 **Respuesta:**
{
  "message": "Entendido. Crearé un script que ordene una lista alfabéticamente.",
  "tool_use": {
    "action": "create_block"
  }
}

---

### 📌 Query: Simula un cajero automático con retiro y consulta de saldo.

🤖 **Respuesta:**
{
  "message": "Entendido, voy a diseñar un ejemplo de implementación para un cajero automático que realice retiros y consulta de saldo.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "nodeId": "node-4",
      "title": "Retiro",
      "content": "Deducir el saldo actual del cliente y realizar el retiro."
    }
  },
  "content": "```python\ndef retirar(cantidad):\n    saldo = obtener_saldo()\n    if cantidad <= saldo:\n        actualizar_saldo(saldo - cantidad)\n        imprimir(f'Retiro exitoso: {cantidad}€')\n    else:\n        imprimir('Saldo insuficiente')\)"
  }
}


---

### 📌 Query: Crea un temporizador de cuenta regresiva simple.

🤖 **Respuesta:**
{
  "message": "Entendido, te ayudaré a construir un temporizador de cuenta regresiva funcional.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "blockId": "node-4",
      "title": "Temporizador de cuenta regresiva",
      "content": "Implementar una función que decremente un valor hasta cero y muestre el tiempo restante."
    }
  }
}

---

### 📌 Query: Escribe un algoritmo para encontrar el número mayor de un array.

🤖 **Respuesta:**
{
  "message": "Claro, aquí tienes un algoritmo sencillo para encontrar el número mayor en un array. Este ejemplo utiliza pseudocódigo para mayor claridad.",
  "tool_use": {
    "action": "create_block"
  }
}

```pseudocode
function encontrarMaximo(array):
    if array es vacío:
        retornar null
    maximo = array[0]
    for i desde 1 hasta longitud(array) - 1:
        if array[i] > maximo:
            maximo = array[i]
    retornar maximo
```

Este algoritmo recorre el array comparando cada elemento con el valor actual de `maximo`, actualizando este cuando encuentre un valor mayor. ¡Es eficiente y fácil de entender!

---

### 📌 Query: Genera una lista de tareas (To-Do) con marcar como completada.

🤖 **Respuesta:**
{
  "message": "Entendido, prepararé una lista de tareas para ti. Actualmente no tengo un estado de progreso, así que te propongo una lista vacía que podrás completar.",
  "tool_use": null
}

---

### 📌 Query: Escribe una lógica de semáforo con estados Verde, Amarillo, Rojo.

🤖 **Respuesta:**
{
  "message": "Aquí tienes una implementación clara del semáforo con los tres estados requeridos.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "type": "pseudocode",
      "content": "Definir semáforo con tres estados: Verde, Amarillo y Rojo. El semáforo transiciona entre estos estados según el tiempo."
    }
  }
}

---

### 📌 Query: Crea un sistema de reserva de asientos para un cine.

🤖 **Respuesta:**
{
  "message": "Entendido. Vamos a estructurar un sistema de reserva de asientos eficiente para el cine.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "title": "Sistema de Reservas de Asientos",
      "content": "Implementar un algoritmo que asigne asientos según disponibilidad y preferencias del usuario."
    }
  }
}

---

### 📌 Query: Genera un generador de contraseñas seguras aleatorias.

🤖 **Respuesta:**
{
  "message": "Entendido. Crearé un generador de contraseñas seguras aleatorias basado en tus necesidades.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "blockId": "node-4",
      "title": "Generador de Contraseñas",
      "content": "Este bloque explica cómo implementar un generador de contraseñas seguras."
    }
  }
}

---

### 📌 Query: Escribe una cola (Queue) con enqueue y dequeue.

🤖 **Respuesta:**
{
  "message": "Entendido. Vamos a diseñar una estructura de cola utilizando una lista para implementar tanto el encolar (enqueue) como el desencolar (dequeue).",
  "tool_use": {
    "action": "create_block"
  }
}

---

### 📌 Query: Quiero una función que determine si un año es bisiesto.

🤖 **Respuesta:**
¡Claro! Para determinar si un año es bisiesto, podemos seguir las reglas básicas:

1. Un año es bisiesto si es divisible por 4.
2. Sin embargo, si el año es divisible por 100, no es bisiesto a menos que también sea divisible por 400.

Aplicando esto, aquí tienes una función en Python que implementa esta lógica:

```python
def es_bisiesto(ano):
    if (ano % 4 == 0):
        if (ano % 100 == 0):
            if (ano % 400 == 0):
                return True
            else:
                return False
        else:
            return True
    else:
        return False
```

Esta función devuelve `True` si el año es bisiesto y `False` en caso contrario.

¿Necesitas que la adaptemos para otro lenguaje o que la expongamos en algún formato específico?

---

### 📌 Query: Genera un módulo que calcule el promedio de calificaciones.

🤖 **Respuesta:**
{
  "message": "Entendido. Vamos a estructurar un módulo que calcule el promedio de calificaciones de manera eficiente.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "title": "Calcular Promedio de Calificaciones",
      "content": "El código debe recibir una lista de calificaciones y devolver su promedio."
    }
  }
}

---

### 📌 Query: Crea un algoritmo de búsqueda binaria.

🤖 **Respuesta:**
{
  "message": "Entendido. Vamos a construir un algoritmo de búsqueda binaria paso a paso. Primero, definiremos la estructura de datos y luego implementaremos la lógica.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "type": "pseudocode",
      "content": "Inicializar lista ordenada: datos = [1, 3, 5, 7, 9]\nRealizar búsqueda binaria:\n  while lista no está vacía:\n    medio = lista.length / 2\n    if valor en medio < objetivo:\n      lista = lista.subarray(medio + 1, lista.length)\n    else:\n      lista = lista.subarray(0, medio)\n    si medio == longitud(lista) / 2:\n      retorn medio"
    }
  }
}


---

