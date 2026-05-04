import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Sos un nutricionista y entrenador personal experto.
Tu tarea es analizar descripciones en lenguaje natural de comidas y actividades físicas en español argentino,
y devolver respuestas SIEMPRE en formato JSON válido sin texto extra.
Cuando estimás valores porque el usuario no los sabe, marcá estimated: true y explicá brevemente la estimación.`;

async function callOpenAI(userPrompt, maxTokens = 2000) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });
  return JSON.parse(response.choices[0].message.content);
}

export async function analyzeFood(description) {
  const prompt = `Analiza esta descripción de comida: "${description}"

Identificá cada alimento mencionado y generá un formulario para recopilar la información necesaria para calcular sus macronutrientes.

Para cada alimento devolvé:
- id: identificador único
- name: nombre del alimento
- parsed_info: qué info ya pudiste extraer del texto (cantidad, tipo, etc.)
- quantity_field: campo para saber cuánto comió el usuario
- nutrition_fields: campos para los macros (calorías, proteínas, carbohidratos, grasas) por porción estándar
- ai_defaults: valores típicos estimados para cada campo (que el usuario puede aceptar o cambiar)

Si el usuario ya mencionó una cantidad (ej: "dos tostadas"), precargala.
Si el alimento es muy variable (ej: milanesa), pedí el peso.

Respondé SOLO con este JSON:
{
  "food_items": [
    {
      "id": "item_1",
      "name": "nombre del alimento",
      "parsed_info": "info extraída del texto",
      "quantity_field": {
        "label": "¿Cuánto/cuántas comiste?",
        "value": null_o_valor_extraído,
        "unit": "gramos/unidades/etc",
        "ai_default": valor_numérico_estimado,
        "hint": "descripción breve de la estimación"
      },
      "nutrition_fields": [
        {
          "field": "calories",
          "label": "Calorías",
          "per_amount": 100,
          "per_unit": "gramos",
          "value": null,
          "ai_default": valor_estimado,
          "unit": "kcal"
        },
        {
          "field": "protein",
          "label": "Proteínas",
          "per_amount": 100,
          "per_unit": "gramos",
          "value": null,
          "ai_default": valor_estimado,
          "unit": "g"
        },
        {
          "field": "carbs",
          "label": "Carbohidratos",
          "per_amount": 100,
          "per_unit": "gramos",
          "value": null,
          "ai_default": valor_estimado,
          "unit": "g"
        },
        {
          "field": "fat",
          "label": "Grasas",
          "per_amount": 100,
          "per_unit": "gramos",
          "value": null,
          "ai_default": valor_estimado,
          "unit": "g"
        }
      ]
    }
  ]
}`;

  return callOpenAI(prompt, 3000);
}

export async function calculateFood(foodItems, userProfile) {
  const itemsJson = JSON.stringify(foodItems, null, 2);
  const profileJson = JSON.stringify(userProfile, null, 2);

  const prompt = `Calculá los macronutrientes totales para estos alimentos con los datos proporcionados por el usuario.

Perfil del usuario (para contexto de porciones): ${profileJson}

Alimentos con datos del formulario (value = dato del usuario, ai_default = estimación si value es null):
${itemsJson}

Para cada alimento:
1. Usá value si no es null, sino usá ai_default
2. Calculá (nutrition_value / per_amount) * quantity para obtener los macros totales
3. Marcá estimated: true si usaste algún ai_default

Devolvé SOLO este JSON:
{
  "items": [
    {
      "id": "item_id",
      "name": "nombre",
      "quantity_used": número,
      "quantity_unit": "unidad",
      "calories": número,
      "protein": número,
      "carbs": número,
      "fat": número,
      "estimated": true_o_false,
      "estimation_notes": "qué valores se estimaron y por qué (solo si estimated=true)"
    }
  ],
  "totals": {
    "calories": número,
    "protein": número,
    "carbs": número,
    "fat": número,
    "has_estimates": true_o_false
  }
}`;

  return callOpenAI(prompt, 2000);
}

export async function analyzeActivity(description, userProfile) {
  const { weight_kg, gender, age, height_cm } = userProfile;
  const weight = weight_kg || 75;

  const prompt = `Analizá esta descripción de actividad física: "${description}"

Perfil del usuario:
- Peso: ${weight} kg
- Género: ${gender || 'no especificado'}
- Edad: ${age || 'no especificada'} años
- Altura: ${height_cm || 'no especificada'} cm

Identificá cada actividad y calculá las calorías quemadas.
Usá valores MET estándar y la fórmula: Calorías = MET × peso_kg × duración_horas
Si el usuario mencionó calorías directamente de una máquina, usá ese valor y marcalo.

Devolvé SOLO este JSON:
{
  "activities": [
    {
      "name": "nombre de la actividad",
      "description": "descripción detallada",
      "duration_minutes": número,
      "met_value": número,
      "calories_burned": número,
      "from_machine": true_o_false,
      "notes": "notas adicionales"
    }
  ],
  "total_calories_burned": número,
  "calculation_notes": "resumen de cómo se calcularon las calorías"
}`;

  return callOpenAI(prompt, 2000);
}

export function calculateBMR(user) {
  const { weight_kg, height_cm, age, gender } = user;
  if (!weight_kg || !age) return null;

  const w = parseFloat(weight_kg);
  const h = parseFloat(height_cm) || 170;
  const a = parseInt(age);

  // Mifflin-St Jeor
  const base = 10 * w + 6.25 * h - 5 * a;
  return gender === 'female' ? base - 161 : base + 5;
}

export function getBMRSoFar(user, nowISO) {
  const bmrDaily = calculateBMR(user);
  if (!bmrDaily) return null;

  const timezone = user.timezone || 'America/Argentina/Buenos_Aires';
  const now = new Date(nowISO);

  // Hora actual en el timezone del usuario, independiente del timezone del servidor
  const timeStr = now.toLocaleString('en-CA', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const [h, m] = timeStr.split(':').map(Number);
  const currentHour = h + m / 60;

  const wakeHour = parseInt(user.wake_hour ?? 7);
  const sleepHour = parseInt(user.sleep_hour ?? 23);

  // Soporta horarios normales (ej: despertar 7, dormir 23) y cruzados (ej: despertar 22, dormir 6)
  const awakeDurationHours = sleepHour > wakeHour
    ? sleepHour - wakeHour
    : (24 - wakeHour) + sleepHour;

  let hoursAwake;
  if (sleepHour > wakeHour) {
    hoursAwake = Math.min(Math.max(currentHour - wakeHour, 0), awakeDurationHours);
  } else {
    const hoursFromWake = currentHour >= wakeHour
      ? currentHour - wakeHour
      : (24 - wakeHour) + currentHour;
    hoursAwake = currentHour < sleepHour || currentHour >= wakeHour
      ? Math.min(hoursFromWake, awakeDurationHours)
      : awakeDurationHours;
  }

  return Math.max(0, Math.round(bmrDaily * (hoursAwake / 24)));
}
