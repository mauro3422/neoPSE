# 📊 REPORTE DE EVIDENCIA DE STRESS TEST


## 📝 TEST: Escribe la lógica para un sistema de login con 3 intentos máximos.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Para implementar el sistema de login con 3 intentos máximos, se debe validar la entrada y limitar los intentos permitidos.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Quiero una función recursiva en JS para calcular el factorial.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Crearás una función recursiva en JavaScript para calcular el factorial. Primero, definirás la función base y luego el caso recursivo.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** Sí
- **Herramienta invocada:** Sí

---

## 📝 TEST: Crea un algoritmo de ordenamiento BubbleSort en pseudocódigo.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Aquí tienes el algoritmo de ordenamiento BubbleSort en pseudocódigo.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Genera un árbol binario de búsqueda en TypeScript.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Voy a construir un árbol binario de búsqueda en TypeScript paso a paso.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Diseña un conversor de grados Celsius a Fahrenheit.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a construir el algoritmo paso a paso para convertir grados Celsius a Fahrenheit.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Crea una calculadora básica que sume, reste y multiplique.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a construir la calculadora paso a paso.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "blockId": "pseudocode",
      "content": "Definir función suma(X, Y): retorn X + Y; Definir función resta(X, Y): retorn X - Y; Definir función multiplicar(X, Y): retorn X * Y;"
    }
  }
}
```

- **PSeInt detectado:** Sí
- **Herramienta invocada:** Sí

---

## 📝 TEST: Quiero una validación de correo electrónico usando Regex.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a construir un algoritmo para validar correos electrónicos con Regex paso a paso.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "blockId": "node-4",
      "title": "Validación Regex",
      "content": "Usar expresión regular para verificar formato de correo"
    }
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Escribe un bucle que imprima los números primos del 1 al 100.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a crear un bucle que identifique los números primos entre 1 y 100.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Simula el lanzamiento de un dado de 6 caras.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a simular el lanzamiento paso a paso. Generaremos un número aleatorio entre 1 y 6.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "type": "pseudocode",
      "content": "Generar número aleatorio entre 1 y 6"
    }
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Crea una clase abstracta para un Personaje RPG.

### 🤖 Respuesta del Modelo:
```
```pseudocode
abstract class PersonajeRP
    abstract defineAtributos(): void
    abstract defineComportamiento(): void
    abstract ejecutarMision(): void
end class
```
```

- **PSeInt detectado:** No
- **Herramienta invocada:** No

---

## 📝 TEST: Escribe un algoritmo para verificar si una palabra es palíndromo.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Para verificar si una palabra es palíndromo, primero normalizamos la palabra eliminando espacios y convirtiendo a minúsculas, luego comparamos la versión modificada con su versión invertida.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Genera el código para calcular la serie Fibonacci hasta N.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a construir el algoritmo paso a paso para generar la serie Fibonacci hasta el número N.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Quiero un sistema de inventario simple con agregar y eliminar.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a construir un sistema de inventario básico con funcionalidades de agregar y eliminar elementos.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "blockId": "node-4",
      "title": "Agregar Producto",
      "content": "Definir producto = {id: 1, nombre: 'Laptop', cantidad: 5}"
    }
  }
}
```

- **PSeInt detectado:** Sí
- **Herramienta invocada:** Sí

---

## 📝 TEST: Escribe una función que cuente las vocales de un texto.

### 🤖 Respuesta del Modelo:
```
Para contar las vocales en un texto, se puede iterar sobre cada carácter y verificar si es una vocal (a, e, i, o, u). El pseudocódigo sería:

1. Inicializar contador de vocales.
2. Recorrer cada carácter del texto.
3. Si el carácter es una vocal, incrementar el contador.
4. Devolver el valor final del contador.

Este enfoque asegura un recorrido eficiente y claro del flujo lógico.
```

- **PSeInt detectado:** No
- **Herramienta invocada:** No

---

## 📝 TEST: Genera una matriz de 3x3 rellena de ceros.

### 🤖 Respuesta del Modelo:
```
{
  "matrix": [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** No

---

## 📝 TEST: Crea un sistema de combate por turnos básico.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a diseñar un sistema de combate por turnos sencillo. Primero, definiremos las clases de personajes y sus estadísticas. Luego, implementaremos un bucle de turnos donde cada personaje realiza acciones basadas en sus turnos.",
  "tool_use": {
    "create_block": {
      "params": {
        "type": "pseudocode",
        "content": "Definir ClasePersonaje con atributos: nombre, fuerza, velocidad"
      }
    },
    "edit_block_content": {
      "params": {
        "blockId": "node-1",
        "content": "Inicializar atributos de Personaje"
      }
    },
    "link_blocks": {
      "fromId": "node-2",
      "toId": "node-3"
    }
  }
}
```

- **PSeInt detectado:** Sí
- **Herramienta invocada:** Sí

---

## 📝 TEST: Escribe una lógica de juego 'Piedra, Papel o Tijera'.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a estructurar la lógica del juego piedra, papel o tijera paso a paso.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Crea un algoritmo para calcular el área de un círculo.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Para calcular el área de un círculo, se utiliza la fórmula A = πr². El algoritmo iterará para obtener el radio y luego aplicará la fórmula.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Quiero un script que ordene una lista alfabéticamente.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a crear un algoritmo para ordenar una lista alfabéticamente paso a paso.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Escribe un algoritmo para encontrar el número mayor de un array.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Para encontrar el número mayor en un array, se debe recorrer los elementos y mantener el valor máximo encontrado hasta el momento.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Simula un cajero automático con retiro y consulta de saldo.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a diseñar el flujo lógico para simular un cajero automático que realice retiros y consultas de saldo.",
  "tool_use": {
    "action": "create_block"
  },
  "pseudocódigo": "Inicializar cajero; Leer saldo actual. Si saldo >= cantidad a retirar, realizar retiro y actualizar saldo. Mostrar saldo actualizado. Si saldo < cantidad, mostrar mensaje de error."
}

```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Crea un temporizador de cuenta regresiva simple.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a construir el temporizador de cuenta regresiva paso a paso.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Genera una lista de tareas (To-Do) con marcar como completada.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Lista de tareas generada",
  "tool_use": {
    "action": "create_block",
    "params": {
      "blockId": "todo_list",
      "content": "Completar la lista de tareas"
    }
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Escribe una lógica de semáforo con estados Verde, Amarillo, Rojo.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Aquí tienes la lógica del semáforo en tres estados: Verde, Amarillo y Rojo.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Quiero una función que determine si un año es bisiesto.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a construir la función paso a paso para verificar si un año es bisiesto.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Crea un sistema de reserva de asientos para un cine.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a diseñar un sistema que permita gestionar las reservas de asientos en un cine de manera eficiente.",
  "tool_use": {
    "action": "create_block",
    "params": {
      "blockId": "node-4",
      "title": "Definir Estructura",
      "content": "Crear una estructura de datos para almacenar información de los usuarios y sus reservas."
    }
  }
}
```

- **PSeInt detectado:** Sí
- **Herramienta invocada:** Sí

---

## 📝 TEST: Genera un generador de contraseñas seguras aleatorias.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Crearé un generador de contraseñas seguras aleatorias en pseudocódigo.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Escribe una cola (Queue) con enqueue y dequeue.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Crear estructura de cola con operaciones enqueue y dequeue",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Crea un algoritmo de búsqueda binaria.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Vamos a construir el algoritmo paso a paso para la búsqueda binaria.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---

## 📝 TEST: Genera un módulo que calcule el promedio de calificaciones.

### 🤖 Respuesta del Modelo:
```
{
  "message": "Crearé el pseudocódigo para calcular el promedio de calificaciones paso a paso.",
  "tool_use": {
    "action": "create_block"
  }
}
```

- **PSeInt detectado:** No
- **Herramienta invocada:** Sí

---
