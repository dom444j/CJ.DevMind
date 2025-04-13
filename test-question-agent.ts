import { QuestionAgent } from './agents/question-agent';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as fs from 'fs'; // 👈 requerido para pasarlo al método guardarContexto

// Crea instancia del agente cuestionario
const agent = new QuestionAgent('testUser');

// 1. Crear contexto inicial
let context = agent.generateInitialContext("Mi Proyecto Fumado");
console.log("✅ Contexto inicial generado:", context.id);

// 2. Generar preguntas de nivel 1
const preguntas1 = agent.generarPreguntas(context);
console.log("🧠 Preguntas Nivel 1:", preguntas1);

// 3. Simular respuestas del usuario
const respuestas1 = {
  "¿Cuál es la idea principal del proyecto?": "App para organizar partidas de rol",
  "¿Qué problema busca resolver?": "Falta de herramientas para narradores",
  "¿Quiénes serían los usuarios finales?": "Jugadores de DnD y narradores"
};
context = agent.actualizarContexto(context, respuestas1);

// 4. Calcular y actualizar métricas
context = agent.actualizarMetricas(context);
console.log("📊 Métricas después de respuestas:", context.metricas);

// 5. Crear carpeta si no existe
const dir = join(__dirname, 'context', 'projects');
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

// 6. Guardar el contexto en archivo
const path = join(dir, `${context.id}.json`);
agent.guardarContexto(context, fs, path);
console.log("💾 Contexto guardado en:", path);

// 7. Verificar archivo guardado correctamente
if (existsSync(path)) {
  const loaded = JSON.parse(readFileSync(path, 'utf-8'));
  console.log("📂 Carga correcta del contexto:");
  console.log(`   ID: ${loaded.id}`);
  console.log(`   Métricas:`, loaded.metricas);
} else {
  console.error("❌ Error: archivo no se creó.");
}
