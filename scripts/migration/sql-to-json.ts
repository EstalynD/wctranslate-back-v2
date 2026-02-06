/**
 * Script: SQL → JSON Parser
 *
 * Lee archivos SQL con INSERT statements y genera JSON
 * compatible con el nuevo modelo MongoDB.
 *
 * Uso:
 *   pnpm ts-node scripts/migration/sql-to-json.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ==================== CONFIGURACIÓN ====================

const CONFIG = {
  // Directorio de archivos SQL
  SQL_DIR: path.join(__dirname, '../../db_Migration'),

  // Archivo de salida JSON
  OUTPUT_FILE: path.join(__dirname, './legacy-data.json'),

  // Archivos SQL a procesar (en orden)
  SQL_FILES: {
    modules: 'u280021736_gDPoM.sql',
    // También puede usar archivos individuales si existen
  },
};

// ==================== INTERFACES ====================

interface ParsedModule {
  id: number;
  name: string;
  description: string;
  duration: number;
  tokens: number;
  order_position: number;
  status: string;
  platform_specific: number;
  platform_name: string;
  module_order: number;
}

interface ParsedTheme {
  id: number;
  module_id: number;
  name: string;
  description: string;
  order_position: number;
  status: string;
}

interface ParsedTask {
  id: number;
  theme_id: number;
  name: string;
  description: string;
  content: string;
  token_reward: number;
  order_position: number;
  status: string;
  has_quiz: number;
}

interface ParsedQuizQuestion {
  id: number;
  task_id: number;
  question: string;
  options: string;
  correct_answer: string;
  type: string;
  quiz_position: string;
  order_position: number;
  status: string;
}

interface LegacyData {
  modules: ParsedModule[];
  themes: ParsedTheme[];
  tasks: ParsedTask[];
  quiz_questions: ParsedQuizQuestion[];
}

// ==================== SQL PARSER ====================

/**
 * Extrae el contenido entre paréntesis de TODOS los INSERT para una tabla,
 * manejando strings con comillas escapadas y paréntesis anidados
 */
function extractInsertValues(sql: string, tableName: string): string[][] {
  const allRows: string[][] = [];

  // Buscar TODOS los INSERT INTO para esta tabla
  const tablePattern = new RegExp(
    `INSERT INTO \`?${tableName}\`?\\s*\\([^)]+\\)\\s*VALUES\\s*`,
    'gi'
  );

  let match;
  const regex = new RegExp(tablePattern.source, 'gi');

  while ((match = regex.exec(sql)) !== null) {
    const valuesStart = match.index + match[0].length;

    // Parsear los VALUES desde este punto
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let currentValue = '';
    let currentRow: string[] = [];

    for (let i = valuesStart; i < sql.length; i++) {
      const char = sql[i];
      const prevChar = i > 0 ? sql[i - 1] : '';

      // Manejar strings
      if ((char === "'" || char === '"') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          // Verificar si es escape de comilla doble ''
          if (sql[i + 1] === char) {
            currentValue += char;
            i++; // Skip next quote
            continue;
          }
          inString = false;
          stringChar = '';
        }
      }

      if (inString) {
        currentValue += char;
        continue;
      }

      // Detectar inicio de tupla
      if (char === '(') {
        if (depth === 0) {
          currentRow = [];
          currentValue = '';
        } else {
          currentValue += char;
        }
        depth++;
        continue;
      }

      // Detectar fin de tupla
      if (char === ')') {
        depth--;
        if (depth === 0) {
          // Guardar último valor
          currentRow.push(currentValue.trim());
          allRows.push(currentRow);
          currentValue = '';
        } else {
          currentValue += char;
        }
        continue;
      }

      // Detectar separador de valores dentro de tupla
      if (char === ',' && depth === 1) {
        currentRow.push(currentValue.trim());
        currentValue = '';
        continue;
      }

      // Detectar fin de statement (salir del while interno)
      if (char === ';' && depth === 0) {
        break;
      }

      if (depth > 0) {
        currentValue += char;
      }
    }
  }

  return allRows;
}

/**
 * Limpia un valor extraído del SQL
 */
function cleanValue(value: string): string {
  if (!value) return '';

  // Remover comillas externas
  value = value.trim();
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1);
  }

  // Decodificar escapes
  value = value
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');

  // Manejar NULL
  if (value.toUpperCase() === 'NULL') {
    return '';
  }

  return value;
}

/**
 * Parsea módulos desde SQL
 */
function parseModules(sql: string): ParsedModule[] {
  const rows = extractInsertValues(sql, 'wp_training_wc_modules');
  console.log(`  📦 Encontradas ${rows.length} filas de modules`);

  return rows.map((row) => ({
    id: parseInt(cleanValue(row[0])) || 0,
    name: cleanValue(row[1]),
    description: cleanValue(row[2]),
    duration: parseInt(cleanValue(row[3])) || 30,
    tokens: parseInt(cleanValue(row[4])) || 0,
    order_position: parseInt(cleanValue(row[5])) || 0,
    status: cleanValue(row[6]) || 'active',
    // created_at: row[7] - ignorado
    // updated_at: row[8] - ignorado
    platform_specific: parseInt(cleanValue(row[9])) || 0,
    platform_name: cleanValue(row[10]) || '',
    module_order: parseInt(cleanValue(row[11])) || 0,
  }));
}

/**
 * Parsea themes desde SQL
 */
function parseThemes(sql: string): ParsedTheme[] {
  const rows = extractInsertValues(sql, 'wp_training_wc_themes');
  console.log(`  📑 Encontradas ${rows.length} filas de themes`);

  return rows.map((row) => ({
    id: parseInt(cleanValue(row[0])) || 0,
    module_id: parseInt(cleanValue(row[1])) || 0,
    name: cleanValue(row[2]),
    description: cleanValue(row[3]),
    order_position: parseInt(cleanValue(row[4])) || 0,
    status: cleanValue(row[5]) || 'active',
  }));
}

/**
 * Parsea tasks desde SQL
 */
function parseTasks(sql: string): ParsedTask[] {
  const rows = extractInsertValues(sql, 'wp_training_wc_tasks');
  console.log(`  📝 Encontradas ${rows.length} filas de tasks`);

  return rows.map((row) => ({
    id: parseInt(cleanValue(row[0])) || 0,
    theme_id: parseInt(cleanValue(row[1])) || 0,
    name: cleanValue(row[2]),
    description: cleanValue(row[3]),
    content: cleanValue(row[4]),
    token_reward: parseInt(cleanValue(row[5])) || 0,
    order_position: parseInt(cleanValue(row[6])) || 0,
    status: cleanValue(row[7]) || 'active',
    has_quiz: parseInt(cleanValue(row[8])) || 0,
  }));
}

/**
 * Parsea quiz questions desde SQL
 */
function parseQuizQuestions(sql: string): ParsedQuizQuestion[] {
  const rows = extractInsertValues(sql, 'wp_training_wc_quiz_questions');
  console.log(`  ❓ Encontradas ${rows.length} filas de quiz_questions`);

  return rows.map((row) => ({
    id: parseInt(cleanValue(row[0])) || 0,
    task_id: parseInt(cleanValue(row[1])) || 0,
    question: cleanValue(row[2]),
    options: cleanValue(row[3]),
    correct_answer: cleanValue(row[4]),
    type: cleanValue(row[5]) || 'multiple',
    quiz_position: cleanValue(row[6]) || 'pre',
    order_position: parseInt(cleanValue(row[7])) || 0,
    status: cleanValue(row[8]) || 'active',
  }));
}

// ==================== MAIN ====================

async function main() {
  console.log('🔄 SQL → JSON Parser\n');

  // Leer archivo SQL principal
  const sqlFilePath = path.join(CONFIG.SQL_DIR, CONFIG.SQL_FILES.modules);

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Archivo SQL no encontrado: ${sqlFilePath}`);
    process.exit(1);
  }

  console.log(`📂 Leyendo: ${sqlFilePath}`);
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  console.log('\n🔍 Parseando tablas...');

  const legacyData: LegacyData = {
    modules: parseModules(sqlContent),
    themes: parseThemes(sqlContent),
    tasks: parseTasks(sqlContent),
    quiz_questions: parseQuizQuestions(sqlContent),
  };

  // Verificar datos
  console.log('\n📊 Resumen de datos parseados:');
  console.log(`  - Modules: ${legacyData.modules.length}`);
  console.log(`  - Themes: ${legacyData.themes.length}`);
  console.log(`  - Tasks: ${legacyData.tasks.length}`);
  console.log(`  - Quiz Questions: ${legacyData.quiz_questions.length}`);

  // Mostrar algunos ejemplos
  if (legacyData.modules.length > 0) {
    console.log('\n📋 Ejemplo de módulo parseado:');
    console.log(JSON.stringify(legacyData.modules[0], null, 2));
  }

  if (legacyData.themes.length > 0) {
    console.log('\n📋 Ejemplo de theme parseado:');
    console.log(JSON.stringify(legacyData.themes[0], null, 2));
  }

  if (legacyData.tasks.length > 0) {
    console.log('\n📋 Ejemplo de task parseado:');
    const exampleTask = { ...legacyData.tasks[0] };
    // Truncar content para visualización
    if (exampleTask.content && exampleTask.content.length > 100) {
      exampleTask.content = exampleTask.content.substring(0, 100) + '...';
    }
    console.log(JSON.stringify(exampleTask, null, 2));
  }

  // Guardar JSON
  console.log(`\n💾 Guardando en: ${CONFIG.OUTPUT_FILE}`);

  // Crear directorio si no existe
  const outputDir = path.dirname(CONFIG.OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(legacyData, null, 2), 'utf-8');

  console.log('\n✅ JSON generado exitosamente!');

  // Estadísticas adicionales
  const platforms = new Map<string, number>();
  legacyData.modules.forEach((m) => {
    if (m.platform_specific === 1 && m.platform_name) {
      platforms.set(m.platform_name, (platforms.get(m.platform_name) || 0) + 1);
    }
  });

  if (platforms.size > 0) {
    console.log('\n🎯 Módulos por plataforma:');
    platforms.forEach((count, name) => {
      console.log(`  - ${name}: ${count}`);
    });
  }

  // Verificar integridad de relaciones
  console.log('\n🔗 Verificando integridad de relaciones...');

  const moduleIds = new Set(legacyData.modules.map((m) => m.id));
  const themeIds = new Set(legacyData.themes.map((t) => t.id));

  const orphanThemes = legacyData.themes.filter((t) => !moduleIds.has(t.module_id));
  const orphanTasks = legacyData.tasks.filter((t) => !themeIds.has(t.theme_id));

  if (orphanThemes.length > 0) {
    console.log(`  ⚠️ ${orphanThemes.length} themes sin módulo padre`);
  }
  if (orphanTasks.length > 0) {
    console.log(`  ⚠️ ${orphanTasks.length} tasks sin theme padre`);
  }
  if (orphanThemes.length === 0 && orphanTasks.length === 0) {
    console.log('  ✅ Todas las relaciones son válidas');
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
