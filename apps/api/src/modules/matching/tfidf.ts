/**
 * Чистые функции TF-IDF и косинусной близости.
 * Ядро AI-скоринга (см. CLAUDE.md §4 «Матчинг»). Без зависимостей от Nest/Prisma —
 * легко тестируется и переиспользуется.
 */

/** Технические синонимы → каноническая форма, чтобы «ts» и «TypeScript» совпадали. */
const SYNONYMS: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  'react.js': 'react',
  reactjs: 'react',
  'node.js': 'nodejs',
  node: 'nodejs',
  py: 'python',
  postgres: 'postgresql',
  k8s: 'kubernetes',
  'c#': 'csharp',
  golang: 'go',
};

/** Частые слова, не несущие смысла для сопоставления (RU + EN). */
const STOPWORDS = new Set([
  'и', 'в', 'во', 'не', 'на', 'с', 'со', 'а', 'но', 'для', 'по', 'к', 'от', 'до', 'из', 'или',
  'что', 'как', 'это', 'мы', 'вы', 'опыт', 'работа', 'работы', 'будет', 'наш', 'наша',
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'is', 'are', 'we', 'you',
]);

/** Нормализует токен: нижний регистр + раскрытие синонимов. */
const canonical = (token: string): string => {
  const lower = token.toLowerCase();
  return SYNONYMS[lower] ?? lower;
};

/** Токенизация текста: кириллица/латиница/цифры/+/#, без стоп-слов и коротышей. */
export const tokenize = (text: string): string[] => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9+#.]+/gi, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^\.+|\.+$/g, '')) // обрезаем точки по краям
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(canonical);
};

/** Частота терминов (raw counts). */
export const termFrequency = (tokens: string[]): Map<string, number> => {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  return tf;
};

/**
 * IDF по корпусу документов (массив списков токенов).
 * Сглаженная формула: idf = ln((N + 1) / (df + 1)) + 1 — редкие термины весомее.
 */
export const computeIdf = (documents: string[][]): Map<string, number> => {
  const n = documents.length;
  const df = new Map<string, number>();
  for (const doc of documents) {
    for (const term of new Set(doc)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [term, frequency] of df) {
    idf.set(term, Math.log((n + 1) / (frequency + 1)) + 1);
  }
  return idf;
};

/** Вектор TF-IDF из частот и карты IDF (отсутствующий термин → дефолтный idf). */
export const tfidfVector = (
  tf: Map<string, number>,
  idf: Map<string, number>,
  defaultIdf = 1,
): Map<string, number> => {
  const vector = new Map<string, number>();
  for (const [term, freq] of tf) {
    vector.set(term, freq * (idf.get(term) ?? defaultIdf));
  }
  return vector;
};

/** Косинусная близость двух разреженных векторов: 0..1. */
export const cosineSimilarity = (
  a: Map<string, number>,
  b: Map<string, number>,
): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let dot = 0;
  // Итерируем по меньшему вектору ради эффективности.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [key, value] of small) {
    const other = large.get(key);
    if (other) dot += value * other;
  }
  let magA = 0;
  for (const value of a.values()) magA += value * value;
  let magB = 0;
  for (const value of b.values()) magB += value * value;
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
};

/** Косинусная близость двух текстов (IDF считается по этой паре документов). */
export const textCosine = (textA: string, textB: string): number => {
  const docA = tokenize(textA);
  const docB = tokenize(textB);
  if (docA.length === 0 || docB.length === 0) return 0;
  const idf = computeIdf([docA, docB]);
  const vecA = tfidfVector(termFrequency(docA), idf);
  const vecB = tfidfVector(termFrequency(docB), idf);
  return cosineSimilarity(vecA, vecB);
};
