/* ===== Умный старт — конкурсная версия ===== */
const successSound = new Audio("./sound.mp3");

// Звуки: успех — файл; ошибка и лёгкий тап — Web Audio (без доп. файлов)
let _audioCtx = null;
function getAudioCtx() {
  if (_audioCtx) return _audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (Ctx) _audioCtx = new Ctx();
  return _audioCtx;
}
function playWrongSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 180;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (_) {}
}
function playTapSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 520;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch (_) {}
}

const QUESTIONS_PER_ROUND = 6;
const LIVES_START = 3;
const COINS_PER_CORRECT = 5;
const HINT_PRICE = 15;
const LIFE_PRICE = 20;
const STARS_PER_LEVEL = 3;
const TOTAL_LEVELS = 6;

const STARS_PER_CHARACTER_LEVEL = 6;
const MAX_CHARACTER_LEVEL = 15;

const XP_PER_STAT_LEVEL = 10;
const MAX_STAT_LEVEL = 5;

const HERO_STATS_CONFIG = [
  { key: "mind", name: "Ум", icon: "🧠", levelIds: ["math", "russian", "metaskill", "reading", "wordproblems"], visual: { emoji: "🎓", name: "Умная шапочка" } },
  { key: "attention", name: "Внимательность", icon: "👀", levelIds: ["memory", "attention"], visual: { emoji: "🔍", name: "Волшебная лупа" } },
  { key: "logic", name: "Логика", icon: "🧩", levelIds: ["logic"], visual: { emoji: "⚙️", name: "Шестерёнка мысли" } },
  { key: "speed", name: "Скорость", icon: "⚡", levelIds: ["reaction"], visual: { emoji: "⚡", name: "Молния скорости" } },
  { key: "courage", name: "Смелость", icon: "💪", levelIds: [], visual: { emoji: "🦸", name: "Накидка героя" } }
];
const LEVEL_TO_STAT = {};
HERO_STATS_CONFIG.forEach(s => {
  s.levelIds.forEach(lid => { LEVEL_TO_STAT[lid] = s.key; });
});

const RANKS = [
  { id: "newbie", name: "Новичок", icon: "🌱", minStars: 0 },
  { id: "knower", name: "Знаток", icon: "📖", minStars: 30 },
  { id: "master", name: "Мастер", icon: "🏆", minStars: 80 },
  { id: "champion", name: "Чемпион", icon: "👑", minStars: 150 }
];

const DIFFICULTY = [
  { id: "easy", name: "Лёгкий", icon: "🌿", questions: 4, starMul: 1, coinMul: 0.8,
    memoryPairs: 3, memoryStarTime3: 50, memoryStarTime2: 70,
    logicQuestions: 3,
    attentionItems: 3, attentionMemorizeMs: 5000,
    reactionDelayMin: 2000, reactionDelayMax: 4000, reactionStar3Ms: 900, reactionStar2Ms: 1300 },
  { id: "medium", name: "Средний", icon: "🔥", questions: 6, starMul: 1, coinMul: 1,
    memoryPairs: 4, memoryStarTime3: 35, memoryStarTime2: 50,
    logicQuestions: 5,
    attentionItems: 4, attentionMemorizeMs: 4000,
    reactionDelayMin: 1500, reactionDelayMax: 3500, reactionStar3Ms: 650, reactionStar2Ms: 1000 },
  { id: "hard", name: "Сложный", icon: "💪", questions: 8, starMul: 1.25, coinMul: 1.3,
    memoryPairs: 6, memoryStarTime3: 30, memoryStarTime2: 45,
    logicQuestions: 7,
    attentionItems: 5, attentionMemorizeMs: 3000,
    reactionDelayMin: 1000, reactionDelayMax: 3000, reactionStar3Ms: 500, reactionStar2Ms: 800 }
];

const DAILY_BONUS_COINS = 5;
const DAILY_MISSION_REWARD = 10;
const WEEKLY_GOAL_STARS = 15;
const WEEKLY_REWARD_COINS = 30;
const COMBO_3_BONUS = 2;
const COMBO_5_BONUS = 5;
const FULL_LIVES_BONUS_COINS = 3;
const NO_HINT_BONUS_COINS = 5;

const HERO_ABILITIES = [
  { level: 2, icon: "💰", text: "+1 монета за правильный ответ" },
  { level: 5, icon: "💡", text: "Одна бесплатная подсказка в уровне" },
  { level: 8, icon: "❤️", text: "Старт с 4 жизнями" },
  { level: 10, icon: "🛡️", text: "Один раз за уровень: ошибка не забирает жизнь" },
  { level: 12, icon: "✨", text: "Герой светится (уровень 12!)" },
  { level: 15, icon: "🌟", text: "Максимальная сила героя!" }
];

const HEROES = [
  { id: "robik", name: "Робик", icon: "🤖", desc: "Робот-помощник, любит учиться" },
  { id: "fox", name: "Лисёнок", icon: "🦊", desc: "Ловкий и умный" },
  { id: "bear", name: "Медвежонок", icon: "🐻", desc: "Сильный и добрый" },
  { id: "star", name: "Звёздочка", icon: "⭐", desc: "Мечтает стать учёным" },
  { id: "owl", name: "Совёнок", icon: "🦉", desc: "Любит читать и думать" },
  { id: "cat", name: "Котик", icon: "🐱", desc: "Любопытный и внимательный" }
];

const STORY_QUESTS = [
  { id: "first_step", icon: "🌱", title: "Первый шаг", text: "Сделай первый шаг — реши задание в любой области", check: s => (s.totalCorrect || 0) >= 1, reward: 15 },
  { id: "first_wisdom", icon: "🧠", title: "Первая мудрость", text: "Научись как учиться — пройди урок в Поляне Мудрости", check: s => (s.completedMetaLessons || []).length >= 1, reward: 15 },
  { id: "light_tower", icon: "🔢", title: "Свет в башне", text: "Освой счёт — получи 3 звезды в Башне чисел", check: s => (s.levelStars?.math || 0) >= 3, reward: 20 },
  { id: "letters_awake", icon: "📚", title: "Буквы проснулись", text: "Освой буквы — получи 3 звезды в Долине букв", check: s => (s.levelStars?.russian || 0) >= 3, reward: 20 },
  { id: "memory_back", icon: "🃏", title: "Память вернулась", text: "Пройди игру «Найди пары»", check: s => (s.levelStars?.memory || 0) >= 1, reward: 20 },
  { id: "logic_won", icon: "🧩", title: "Логика победила", text: "Пройди игру «Найди лишнее»", check: s => (s.levelStars?.logic || 0) >= 1, reward: 20 },
  { id: "eyes_opened", icon: "👀", title: "Глаза открылись", text: "Пройди игру «Внимание»", check: s => (s.levelStars?.attention || 0) >= 1, reward: 20 },
  { id: "lightning", icon: "⚡", title: "Молния ударила", text: "Пройди игру «Реакция»", check: s => (s.levelStars?.reaction || 0) >= 1, reward: 20 },
  { id: "island_saved", icon: "🏝️", title: "Остров спасён!", text: "Освой все 6 областей Острова", check: s => (s.unlockedLevels || 0) >= 6, reward: 50 }
];

const BOSS_REWARD_COINS = 30;
const BOSS_LEVEL_IDS = ["math", "russian"];

const TITLES = [
  { id: "young_math", name: "Юный математик", icon: "🔢", check: s => (s.levelStars?.math || 0) >= 3 },
  { id: "reader_master", name: "Мастер чтения", icon: "📚", check: s => (s.levelStars?.russian || 0) >= 3 },
  { id: "logician", name: "Логик", icon: "🧩", check: s => (s.levelStars?.logic || 0) >= 1 },
  { id: "quick_mind", name: "Быстрый ум", icon: "⚡", check: s => (s.levelStars?.reaction || 0) >= 2 },
  { id: "island_guardian", name: "Защитник Острова", icon: "🛡️", check: s => (s.unlockedLevels || 0) >= 6 },
  { id: "master_of_knowledge", name: "Мастер Знаний", icon: "🌟", check: s => HERO_STATS_CONFIG.every(c => (1 + Math.floor((s.heroStats?.[c.key] || 0) / XP_PER_STAT_LEVEL)) >= MAX_STAT_LEVEL) },
  { id: "island_friend", name: "Верный друг Острова", icon: "🤝", check: s => (s.streakDays || 0) >= 3 }
];

const DAILY_MISSIONS = [
  { id: "fireflies", icon: "✨", title: "Собери 5 Светлячков", target: 5, progressKey: "correct", reward: DAILY_MISSION_REWARD },
  { id: "light_area", icon: "🔦", title: "Освети одну область", target: 1, progressKey: "levels", reward: DAILY_MISSION_REWARD },
  { id: "hero_rise", icon: "⬆️", title: "Помоги герою подняться", target: 1, progressKey: "statLevels", reward: DAILY_MISSION_REWARD }
];

const MAP_LEVELS = [
  { id: "math", icon: "🔢", title: "Математика", desc: "Реши примеры", location: "Башня чисел" },
  { id: "russian", icon: "📚", title: "Русский язык", desc: "Вставь букву", location: "Долина букв" },
  { id: "memory", icon: "🃏", title: "Память", desc: "Найди пары", location: "Сад воспоминаний" },
  { id: "logic", icon: "🧩", title: "Логика", desc: "Найди лишнее", location: "Лабиринт логики" },
  { id: "attention", icon: "👀", title: "Внимание", desc: "Что изменилось?", location: "Озеро внимания" },
  { id: "reaction", icon: "⚡", title: "Реакция", desc: "Жми вовремя!", location: "Молния скорости" }
];

const META_LESSONS = [
  { id: "read_task", icon: "📖", title: "Как читать задачу", theory: "Прочитай задачу 2 раза. Первый раз — понять. Второй — найти числа и вопрос. Спроси себя: о чём задача?", example: "Задача: «У Линды 3 яблока, у Адама 5. Сколько всего?» Главное: числа 3 и 5, вопрос «сколько всего».", statKey: "mind", interactive: { question: "В задаче: «У Хадижи 4 конфеты, у Исы 3. Сколько всего?» — что главное найти?", options: ["Имена детей", "Сколько всего конфет", "Где они сидят"], correct: 1 } },
  { id: "find_main", icon: "🔍", title: "Как находить главное", theory: "Слова «всего», «осталось», «сколько» — подсказки. Числа и вопрос — главное. Остальное помогает понять.", example: "«Сколько всего конфет?» — слово «всего» подсказывает: нужно складывать.", statKey: "mind", interactive: { question: "Какое слово подсказывает, что нужно складывать?", options: ["осталось", "всего", "подели"], correct: 1 } },
  { id: "check_answer", icon: "✓", title: "Как проверять ответ", theory: "Подставь ответ в задачу. Логично? Проверь другим способом: 7+5=12 → 12−5=7. Верно!", example: "Ответ 8. Проверка: 3+5=8 и 8−3=5. Всё сходится!", statKey: "logic", interactive: { question: "Если 7+5=12, как проверить?", options: ["12−7=5", "12+5=7", "7−5=12"], correct: 0 } },
  { id: "no_fear", icon: "💪", title: "Как не бояться ошибки", theory: "Ошибка говорит: «Так не надо». Дыши, попробуй снова. Ты станешь умнее!", example: "Не получилось? Пауза, вдох, попробуй ещё раз.", statKey: "courage", interactive: { question: "Что делать, если ошибся?", options: ["расстроиться", "сделать паузу и попробовать снова", "бросить"], correct: 1 } }
];

const READING_TEXTS = [
  { id: "1", grade: 1, text: "Кот Мурзик любит молоко. Каждое утро мама наливает ему в миску. Мурзик пьёт и мурлычет. Потом он спит на диване.", questions: [
    { q: "Кто любит молоко?", opts: ["Собака", "Кот Мурзик", "Мама", "Птица"], correct: 1, type: "fact" },
    { q: "Почему Мурзик мурлычет?", opts: ["Он голодный", "Ему нравится молоко", "Он спит", "Ему холодно"], correct: 1, type: "inference" },
    { q: "О чём этот текст?", opts: ["О собаке", "О коте Мурзике и его утре", "О маме", "О птицах"], correct: 1, type: "main" }
  ]},
  { id: "2", grade: 1, text: "Линда и Адам пошли в парк. Там они качались на качелях. Потом кормили уток у пруда. Домой вернулись вечером, уставшие, но довольные.", questions: [
    { q: "Куда пошли Линда и Адам?", opts: ["В магазин", "В парк", "В школу", "В кино"], correct: 1, type: "fact" },
    { q: "Чем они занимались?", opts: ["Только качались", "Качались и кормили уток", "Только кормили уток", "Играли в мяч"], correct: 1, type: "fact" },
    { q: "Как они вернулись домой?", opts: ["Голодные", "Уставшие, но довольные", "Злые", "Скучные"], correct: 1, type: "fact" }
  ]},
  { id: "3", grade: 2, text: "Зимой выпал снег. Дети взяли санки и поехали с горки. Ислам скатился первый. Потом Хава. Все смеялись и веселились.", questions: [
    { q: "Когда выпал снег?", opts: ["Летом", "Зимой", "Осенью", "Весной"], correct: 1, type: "fact" },
    { q: "Что взяли дети?", opts: ["Мяч", "Санки", "Велосипед", "Коньки"], correct: 1, type: "fact" },
    { q: "Кто скатился первый?", opts: ["Хава", "Ислам", "Все вместе", "Никто"], correct: 1, type: "fact" }
  ]},
  { id: "4", grade: 2, text: "У бабушки в деревне есть огород. Там растут морковь, огурцы и помидоры. В августе мы ездим помогать собирать урожай. Бабушка варит вкусное варенье.", questions: [
    { q: "Где огород?", opts: ["В городе", "У бабушки в деревне", "В школе", "В лесу"], correct: 1, type: "fact" },
    { q: "Что растёт на огороде?", opts: ["Яблоки", "Морковь, огурцы и помидоры", "Грибы", "Цветы"], correct: 1, type: "fact" },
    { q: "Когда ездят помогать?", opts: ["Зимой", "В августе", "Весной", "В сентябре"], correct: 1, type: "fact" }
  ]},
  { id: "5", grade: 3, text: "Медвежонок Миша нашёл в лесу дупло. Внутри было тёпло и уютно. Он решил перезимовать там. Осенью Миша натаскал листьев для подстилки.", questions: [
    { q: "Где Миша нашёл дупло?", opts: ["В парке", "В лесу", "Во дворе", "В саду"], correct: 1, type: "fact" },
    { q: "Что решил сделать Миша?", opts: ["Продать дупло", "Перезимовать там", "Показать друзьям", "Покинуть дупло"], correct: 1, type: "fact" },
    { q: "Когда он натаскал листьев?", opts: ["Зимой", "Весной", "Осенью", "Летом"], correct: 2, type: "fact" }
  ]}
];

const WORD_PROBLEMS = [
  { level: 1, task: "У Линды 3 яблока, у Адама 5. Сколько всего?", who: "Линда, Адам", known: "3, 5", find: "всего", keyWords: ["всего", "3", "5"], scheme: "🍎🍎🍎 + 🍎🍎🍎🍎🍎", answer: 8, subskillId: "wp_keyword_total" },
  { level: 2, task: "В корзине было 7 груш. 3 груши съели. Сколько осталось?", who: "—", known: "Было 7, съели 3", find: "осталось", keyWords: ["осталось", "7", "3"], scheme: "🍐×7 − 🍐×3", answer: 4, subskillId: "wp_keyword_left" },
  { level: 1, task: "На одной тарелке 4 печенья, на другой столько же. Сколько печенья на двух тарелках?", who: "—", known: "4 на одной, столько же на другой", find: "на двух тарелках", keyWords: ["столько же", "двух"], scheme: "🍪🍪🍪🍪 + 🍪🍪🍪🍪", answer: 8, subskillId: "wp_keyword_same" },
  { level: 2, task: "У Ислама 6 машинок. Ему подарили ещё 2. Сколько стало?", who: "Ислам", known: "6 машинок, подарили 2", find: "стало", keyWords: ["стало", "ещё"], scheme: "🚗×6 + 🚗×2", answer: 8, subskillId: "wp_keyword_total" },
  { level: 2, task: "В вазе 9 цветков. 5 — розы, остальные — тюльпаны. Сколько тюльпанов?", who: "—", known: "9 цветков, 5 роз", find: "тюльпанов", keyWords: ["остальные", "9", "5"], scheme: "🌸×9 − 🌹×5", answer: 4, subskillId: "wp_keyword_rest" }
];

const KNOWLEDGE_SKILLS = [
  { id: "math", name: "Счёт", icon: "🔢", statKey: "mind", levelIds: ["math", "wordproblems"] },
  { id: "reading", name: "Понимание текста", icon: "📖", statKey: "mind", levelIds: ["reading"] },
  { id: "wordproblems", name: "Задачи", icon: "📝", statKey: "mind", levelIds: ["wordproblems"] },
  { id: "metaskill", name: "Мета-умения", icon: "🧠", statKey: "mind", levelIds: ["metaskill"] },
  { id: "attention", name: "Внимание", icon: "👀", statKey: "attention", levelIds: ["attention", "memory"] },
  { id: "logic", name: "Логика", icon: "🧩", statKey: "logic", levelIds: ["logic"] }
];

// Поднавыки (микро-компетенции) для карты компетенций
const SUBSKILLS_DEFAULT = {
  math: { math_add_small: { correct: 0, total: 0 }, math_sub_small: { correct: 0, total: 0 }, math_add_big: { correct: 0, total: 0 }, math_sub_big: { correct: 0, total: 0 } },
  reading: { reading_fact: { correct: 0, total: 0 }, reading_inference: { correct: 0, total: 0 }, reading_main: { correct: 0, total: 0 } },
  wordproblems: { wp_keyword_total: { correct: 0, total: 0 }, wp_keyword_left: { correct: 0, total: 0 }, wp_keyword_same: { correct: 0, total: 0 }, wp_keyword_rest: { correct: 0, total: 0 } },
  metaskill: { meta_read_task: { completed: false }, meta_find_main: { completed: false }, meta_check: { completed: false }, meta_no_fear: { completed: false } },
  attention: { attention_compare: { correct: 0, total: 0 }, memory_pairs: { correct: 0, total: 0 } },
  logic: { logic_odd_one: { correct: 0, total: 0 } }
};
const SUBSKILL_NAMES = {
  math_add_small: "Сложение в пределах 12", math_sub_small: "Вычитание в пределах 12", math_add_big: "Сложение до 20+", math_sub_big: "Вычитание до 20+",
  reading_fact: "Поиск факта", reading_inference: "Вывод из текста", reading_main: "Главная мысль",
  wp_keyword_total: "Задачи на «всего»", wp_keyword_left: "Задачи на «осталось»", wp_keyword_same: "«Столько же»", wp_keyword_rest: "«Остальные»",
  meta_read_task: "Читать задачу", meta_find_main: "Находить главное", meta_check: "Проверять ответ", meta_no_fear: "Не бояться ошибки",
  attention_compare: "Найти изменение", memory_pairs: "Найти пары",
  logic_odd_one: "Найти лишнее"
};

const REPEAT_LEVEL_BONUS = 1.2;

// Стадии освоения: Освоил → Закрепил → Применил
// Педагогика: Освоил = первый успех, понимание; Закрепил = стабильно получается; Применил = уверенно в разных заданиях.
// Ошибки не понижают стадию — показываем «Потренируй ещё» по последним попыткам, без наказания.
const STAGE_CONFIG = {
  learned: { name: "Освоил", icon: "🌱", minRatio: 0.5, minTotal: 1 },
  consolidated: { name: "Закрепил", icon: "🌿", minRatio: 0.7, minTotal: 5 },
  applied: { name: "Применил", icon: "🌟", minRatio: 0.9, minTotal: 7 }
};
const STAGE_LAST_ATTEMPTS_SIZE = 5;
const STAGE_REINFORCE_THRESHOLD = 2; // если в последних 5 попытках ≤2 верных — мягко предложить закрепить
const APPLIED_STAGE_HERO_BONUS = 3; // +XP герою при переходе в стадию «Применил»

// Педагогическая модель: условия открытия модулей
const MODULE_UNLOCK = {
  wordproblems: { metaLessons: 1, readingTexts: 1 },
  memory: { minStars: 5 },
  logic: { minStars: 10 },
  attention: { minStars: 15 },
  reaction: { minStars: 20 }
};
const ERROR_LOG_MAX = 50;
const WEAK_TOPIC_THRESHOLD = 2;

// Рекомендации: пороги для «зоны роста»
const RECOMMEND_STABILITY_MAX = 60;   // стабильность ниже 60% → предложить закрепить
const RECOMMEND_DAYS_SINCE_PRACTICE = 7; // не повторял N дней → предложить вернуться

// Классификация ошибок по модулям и мягкие рекомендации (без ощущения «меня анализируют»)
const ERROR_RECOMMENDATIONS = {
  math_addition: "Потренируем сложение?",
  math_subtraction: "Потренируем вычитание?",
  math_add_small: "Потренируем сложение в пределах 12?",
  math_sub_small: "Потренируем вычитание в пределах 12?",
  math_add_big: "Потренируем сложение до 20?",
  math_sub_big: "Потренируем вычитание до 20?",
  reading_fact: "Давай ещё раз поищем ответ в тексте?",
  reading_inference: "Потренируем делать выводы из текста?",
  reading_main: "Потренируем находить главную мысль?",
  wordproblems: "Давай разберём ещё одну задачу?",
  wp_keyword_total: "Потренируем задачи на «всего»?",
  wp_keyword_left: "Потренируем задачи на «осталось»?",
  wp_keyword_same: "Потренируем «столько же»?",
  wp_keyword_rest: "Потренируем «остальные»?",
  russian: "Потренируем буквы?",
  logic: "Потренируем искать лишнее?",
  attention: "Потренируем внимание?"
};
const LEVEL_ID_TO_SKILL = { math: "math", russian: "russian", reading: "reading", wordproblems: "wordproblems", logic: "logic", attention: "attention" };

// Режим для родителей: PIN по умолчанию (можно сменить в настройках или коде)
const PARENT_PIN = "1234";

const PRAISE_PHRASES = [
  "Верно! 🎉", "Молодец!", "Умница!", "Так держать!", "Отлично!",
  "Правильно! ✨", "Браво!", "Ты справился!", "Светлячок твой! 💡", "Супер!"
];
const RESULT_PHRASES_3 = ["Супер! Все Светлячки твои! 🎉", "Идеально! Остров светлеет! ✨", "Ты — звезда! 🌟"];
const RESULT_PHRASES_1 = ["Молодец! Продолжай!", "Ещё один Светлячок! 💡", "Ты на правильном пути!"];

const ACHIEVEMENTS = [
  { id: "first", icon: "🌱", name: "Первый шаг", check: s => s.totalCorrect >= 1 },
  { id: "coins50", icon: "💰", name: "50 монет", check: s => s.coins >= 50 },
  { id: "star10", icon: "⭐", name: "10 звёзд", check: s => s.totalStars >= 10 },
  { id: "math5", icon: "🔢", name: "Математик", check: s => (s.levelStars?.math || 0) >= 3 },
  { id: "memory", icon: "🃏", name: "Память", check: s => (s.levelStars?.memory || 0) >= 1 },
  { id: "logic", icon: "🧩", name: "Логик", check: s => (s.levelStars?.logic || 0) >= 1 },
  { id: "reaction", icon: "⚡", name: "Быстрый", check: s => (s.levelStars?.reaction || 0) >= 1 },
  { id: "level3", icon: "🏆", name: "Уровень 3", check: s => s.gameLevel >= 3 },
  { id: "hero5", icon: "🦸", name: "Герой 5 уровня", check: s => 1 + Math.floor((s.totalStars || 0) / STARS_PER_CHARACTER_LEVEL) >= 5 },
  { id: "hero15", icon: "🌟", name: "Герой 15 уровня", check: s => 1 + Math.floor((s.totalStars || 0) / STARS_PER_CHARACTER_LEVEL) >= 15 },
  { id: "allAvatars", icon: "😊", name: "Все аватарки", check: s => SHOP_ITEMS.filter(i => i.type === "avatar").every(i => i.price === 0 || (s.purchasedItems || []).includes(i.id)) },
  { id: "allBackgrounds", icon: "🎨", name: "Все фоны", check: s => SHOP_ITEMS.filter(i => i.type === "background").every(i => i.price === 0 || (s.purchasedItems || []).includes(i.id)) }
];

// ——— Лавка Знаний (педагогический магазин) ———
// Категории: инструменты, сила навыков, остров, аватарки, фоны, скины героя, привилегии
const SHOP_CATEGORIES = [
  { id: "tools", name: "Инструменты", icon: "🛠️", desc: "Помогают думать" },
  { id: "skillBoost", name: "Сила навыков", icon: "📈", desc: "Больше пользы от практики" },
  { id: "island", name: "Остров", icon: "🏝️", desc: "Украшаем и укрепляем" },
  { id: "avatar", name: "Аватарки", icon: "😊", desc: "Твой образ" },
  { id: "background", name: "Фоны", icon: "🎨", desc: "Фон карты" },
  { id: "heroSkin", name: "Скины героя", icon: "🦸", desc: "Образ героя" },
  { id: "extra", name: "Привилегии", icon: "✨", desc: "Помощники" }
];

const SHOP_ITEMS = [
  { id: "tool_hint_round", type: "tools", name: "Фонарь на раунд", icon: "🏮", price: 20, value: "freeHintRound", desc: "Один раз за раунд подсказка бесплатно. Не даёт ответ — убирает 2 неверных варианта.", duration: "round" },
  { id: "tool_shield_think", type: "tools", name: "Щит размышления", icon: "🛡️", price: 35, value: "shieldThink", desc: "Один раз за раунд: после ошибки даётся подсказка и шанс ответить снова, жизнь не теряется.", duration: "round" },
  { id: "tool_time_think", type: "tools", name: "Время подумать", icon: "⏳", price: 15, value: "timeThink", desc: "В этом раунде Светлячок напомнит: не спеши, перечитай вопрос.", duration: "round" },
  { id: "skill_math", type: "skillBoost", name: "Сила счёта", icon: "🔢", price: 40, value: "skillXp_math", skillId: "math", tasksCount: 5, xpMul: 1.5, desc: "Следующие 5 заданий по математике — +50% силы герою (Ум)." },
  { id: "skill_reading", type: "skillBoost", name: "Сила чтения", icon: "📖", price: 40, value: "skillXp_reading", skillId: "reading", tasksCount: 5, xpMul: 1.5, desc: "Следующие 5 текстов/вопросов — +50% силы герою (Ум)." },
  { id: "skill_tasks", type: "skillBoost", name: "Сила задач", icon: "📝", price: 40, value: "skillXp_wordproblems", skillId: "wordproblems", tasksCount: 5, xpMul: 1.5, desc: "Следующие 5 задач — +50% силы герою (Ум)." },
  { id: "island_lamp", type: "island", name: "Фонарь на острове", icon: "🔦", price: 60, value: "islandLamp", desc: "Зажечь фонарь. Раз в день — одна бесплатная подсказка в квизе." },
  { id: "island_tree", type: "island", name: "Дерево знаний", icon: "🌳", price: 50, value: "islandTree", desc: "Посадить дерево на Острове. Напоминание: знания растут, когда ты тренируешься." },
  { id: "av_cat", type: "avatar", name: "Котик", icon: "🐱", price: 25, value: "🐱" },
  { id: "av_dog", type: "avatar", name: "Собачка", icon: "🐶", price: 25, value: "🐶" },
  { id: "av_unicorn", type: "avatar", name: "Единорог", icon: "🦄", price: 45, value: "🦄" },
  { id: "av_dragon", type: "avatar", name: "Дракон", icon: "🐲", price: 45, value: "🐲" },
  { id: "av_game", type: "avatar", name: "Геймер", icon: "🎮", price: 35, value: "🎮" },
  { id: "av_alien", type: "avatar", name: "Инопланетянин", icon: "👾", price: 35, value: "👾" },
  { id: "av_star", type: "avatar", name: "Звёздочка", icon: "🌟", price: 55, value: "🌟" },
  { id: "av_bear", type: "avatar", name: "Мишка", icon: "🧸", price: 40, value: "🧸" },
  { id: "bg_default", type: "background", name: "Обычный", icon: "🌈", price: 0, value: "default" },
  { id: "bg_ocean", type: "background", name: "Океан", icon: "🌊", price: 60, value: "ocean" },
  { id: "bg_space", type: "background", name: "Космос", icon: "🚀", price: 80, value: "space" },
  { id: "bg_forest", type: "background", name: "Лес", icon: "🌲", price: 70, value: "forest" },
  { id: "bg_candy", type: "background", name: "Сказка", icon: "🍬", price: 90, value: "candy" },
  { id: "skin_robik_astro", type: "heroSkin", name: "Робик-космонавт", icon: "🤖", price: 40, value: "robik_astro", heroId: "robik", desc: "Новый образ героя на карте и в профиле. Только внешний вид." },
  { id: "skin_fox_super", type: "heroSkin", name: "Супер-лис", icon: "🦊", price: 40, value: "fox_super", heroId: "fox", desc: "Новый образ героя на карте и в профиле. Только внешний вид." },
  { id: "skin_bear_king", type: "heroSkin", name: "Медведь-король", icon: "🐻", price: 40, value: "bear_king", heroId: "bear", desc: "Новый образ героя на карте и в профиле. Только внешний вид." },
  { id: "skin_star_gold", type: "heroSkin", name: "Золотая звёздочка", icon: "⭐", price: 40, value: "star_gold", heroId: "star", desc: "Новый образ героя на карте и в профиле. Только внешний вид." },
  { id: "skin_owl_wise", type: "heroSkin", name: "Совёнок-мудрец", icon: "🦉", price: 40, value: "owl_wise", heroId: "owl", desc: "Новый образ героя на карте и в профиле. Только внешний вид." },
  { id: "skin_cat_ninja", type: "heroSkin", name: "Котик-ниндзя", icon: "🐱", price: 40, value: "cat_ninja", heroId: "cat", desc: "Новый образ героя на карте и в профиле. Только внешний вид." },
  { id: "ex_life", type: "extra", name: "Сердечко героя", icon: "❤️", price: 100, value: "extraLife", desc: "+1 жизнь в квизе. Герой чуть выносливее." },
  { id: "ex_frame", type: "extra", name: "Золотая рамка", icon: "🖼️", price: 50, value: "goldFrame", desc: "Красивая рамка карточки" },
  { id: "ex_double", type: "extra", name: "Сокровище острова", icon: "💰💰", price: 80, value: "doubleCoins", desc: "В 2 раза больше монет за ответы" }
];

const state = {
  name: "",
  avatar: "🤖",
  character: null,
  characterSkin: null,
  coins: 0,
  totalStars: 0,
  totalCorrect: 0,
  gameLevel: 1,
  levelStars: {},
  achievements: [],
  unlockedLevels: 1,
  purchasedItems: [],
  selectedBackground: "default",
  selectedExtras: [],
  lastLoginDate: null,
  weekStartDate: null,
  weeklyStars: 0,
  weeklyRewardClaimed: false,
  weeklyCorrect: 0,
  weeklyAttempts: 0,
  weeklyErrors: 0,
  weeklySnapshots: [],
  heroStats: { mind: 0, attention: 0, logic: 0, speed: 0, courage: 0 },
  completedQuests: [],
  dailyMissionsReset: null,
  dailyMissionsProgress: { correct: 0, levels: 0, statLevels: 0 },
  dailyMissionsClaimed: [],
  completedBosses: [],
  unlockedTitles: [],
  selectedTitle: null,
  lastPlayDate: null,
  streakDays: 0,
  dailyLevelsPlayed: {},
  completedMetaLessons: [],
  errorLog: [],
  skillProgress: {},
  readingTextsCompleted: [],
  labSuggestedThisSession: false,
  hasSeenIntro: false,
  subskillProgress: null,
  activeBoosters: [],
  lastFreeHintDate: null
};

let currentLives, currentCorrect, currentQuestionIndex, currentQuestions;
let maxLivesThisRound = LIVES_START;
let hintUsedThisRound = false;
let lifeBoughtThisRound = false;
let freeHintUsedThisRound = false;
let shieldUsedThisRound = false;
let shieldThinkUsedThisRound = false;
let consecutiveCorrect = 0;
let consecutiveWrong = 0;
let firstCard, memoryTime, timerInterval, matchedPairs, memoryLocked;
let reactionStartTime, reactionTimeout;
let currentDifficulty = null;
let levelsThisSession = 0;

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function showConfirm(options) {
  const {
    title = "Подтверди",
    text = "Ты уверен?",
    yesLabel = "Да",
    noLabel = "Нет",
    icon = "🤔",
    onYes = () => {},
    onNo = () => {}
  } = options;

  const root = document.getElementById("modal-root");
  if (!root) return;
  root.innerHTML = "";
  root.classList.add("active");

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const box = document.createElement("div");
  box.className = "modal-box";
  box.innerHTML = `
    <div class="modal-icon">${icon}</div>
    <div class="modal-title">${title}</div>
    <div class="modal-text">${text}</div>
    <div class="modal-buttons">
      <button type="button" class="btn-secondary" id="modalNo">${noLabel}</button>
      <button type="button" class="btn-primary" id="modalYes">${yesLabel}</button>
    </div>
  `;

  function close() {
    root.classList.remove("active");
    root.innerHTML = "";
  }

  box.querySelector("#modalYes").onclick = () => { close(); onYes(); };
  box.querySelector("#modalNo").onclick = () => { close(); onNo(); };
  overlay.onclick = () => { close(); onNo(); };
  box.onclick = (e) => e.stopPropagation();

  root.appendChild(overlay);
  root.appendChild(box);
}

function showParentPinModal(onSuccess) {
  const root = document.getElementById("modal-root");
  if (!root) return;
  root.innerHTML = "";
  root.classList.add("active");
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const box = document.createElement("div");
  box.className = "modal-box modal-pin";
  box.innerHTML = `
    <div class="modal-icon">👨‍👩‍👧</div>
    <div class="modal-title">Режим для родителей</div>
    <div class="modal-text">Введите PIN-код</div>
    <input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" class="parent-pin-input" id="parentPinInput" placeholder="••••" autocomplete="off" />
    <div class="modal-buttons">
      <button type="button" class="btn-secondary" id="parentPinCancel">Отмена</button>
      <button type="button" class="btn-primary" id="parentPinOk">Войти</button>
    </div>
    <p class="parent-pin-hint">По умолчанию: 1234</p>
  `;
  function close() {
    root.classList.remove("active");
    root.innerHTML = "";
  }
  const input = box.querySelector("#parentPinInput");
  const trySubmit = () => {
    if (input.value === PARENT_PIN) {
      close();
      onSuccess();
    } else {
      showToast("Неверный PIN");
      input.value = "";
      input.focus();
    }
  };
  box.querySelector("#parentPinOk").onclick = trySubmit;
  box.querySelector("#parentPinCancel").onclick = () => close();
  overlay.onclick = () => close();
  box.onclick = (e) => e.stopPropagation();
  input.onkeydown = (e) => { if (e.key === "Enter") trySubmit(); };
  root.appendChild(overlay);
  root.appendChild(box);
  setTimeout(() => input.focus(), 100);
}

function saveProgress() {
  localStorage.setItem("smartStart", JSON.stringify(state));
}

function loadProgress() {
  const s = localStorage.getItem("smartStart");
  if (s) {
    const parsed = JSON.parse(s);
    Object.assign(state, parsed);
    if (state.coins === undefined) state.coins = (state.score || 0) * 2;
    if (state.totalStars === undefined) state.totalStars = 0;
    if (state.totalCorrect === undefined) state.totalCorrect = 0;
    if (state.levelStars === undefined) state.levelStars = {};
    if (state.achievements === undefined) state.achievements = [];
    if (state.unlockedLevels === undefined) state.unlockedLevels = 1;
    if (state.purchasedItems === undefined) state.purchasedItems = [];
    if (state.selectedBackground === undefined) state.selectedBackground = "default";
    if (state.selectedExtras === undefined) state.selectedExtras = [];
    if (state.character === undefined || state.character === null) {
      const def = HEROES[0];
      state.character = { id: def.id, name: def.name, icon: def.icon };
      state.avatar = def.icon;
    }
    if (state.characterSkin === undefined) state.characterSkin = null;
    if (state.lastLoginDate === undefined) state.lastLoginDate = null;
    if (state.weekStartDate === undefined) state.weekStartDate = null;
    if (state.weeklyStars === undefined) state.weeklyStars = 0;
    if (state.weeklyCorrect === undefined) state.weeklyCorrect = 0;
    if (state.weeklyAttempts === undefined) state.weeklyAttempts = 0;
    if (state.weeklyErrors === undefined) state.weeklyErrors = 0;
    if (!state.weeklySnapshots) state.weeklySnapshots = [];
    if (state.weeklyRewardClaimed === undefined) state.weeklyRewardClaimed = false;
    if (!state.heroStats) state.heroStats = { mind: 0, attention: 0, logic: 0, speed: 0, courage: 0 };
    if (!state.completedQuests) state.completedQuests = [];
    if (!state.dailyMissionsProgress) state.dailyMissionsProgress = { correct: 0, levels: 0, statLevels: 0 };
    if (!state.dailyMissionsClaimed) state.dailyMissionsClaimed = [];
    if (!state.completedBosses) state.completedBosses = [];
    if (!state.unlockedTitles) state.unlockedTitles = [];
    if (state.selectedTitle === undefined) state.selectedTitle = null;
    if (state.lastPlayDate === undefined) state.lastPlayDate = null;
    if (state.streakDays === undefined) state.streakDays = 0;
    if (!state.dailyLevelsPlayed) state.dailyLevelsPlayed = {};
    if (!state.completedMetaLessons) state.completedMetaLessons = [];
    if (!state.errorLog) state.errorLog = [];
    if (!state.skillProgress) state.skillProgress = {};
    if (!state.readingTextsCompleted) state.readingTextsCompleted = [];
    if (state.labSuggestedThisSession === undefined) state.labSuggestedThisSession = false;
    if (state.hasSeenIntro === undefined) state.hasSeenIntro = false;
    if (!state.subskillProgress) state.subskillProgress = JSON.parse(JSON.stringify(SUBSKILLS_DEFAULT));
    else ensureSubskillProgress();
    if (!state.activeBoosters) state.activeBoosters = [];
    if (state.lastFreeHintDate === undefined) state.lastFreeHintDate = null;
    state.unlockedLevels = Math.max(state.unlockedLevels || 1, getUnlockedMapLevelsCount());
  }
  applyBackground();
}

function hasBooster(value) {
  const list = state.activeBoosters || [];
  return list.some(b => b.value === value && (b.expiresAt === "round" || (b.expiresAt && b.expiresAt > Date.now())) && (b.tasksLeft == null || b.tasksLeft > 0));
}

function getBooster(value) {
  const list = state.activeBoosters || [];
  return list.find(b => b.value === value && (b.expiresAt === "round" || (b.expiresAt && b.expiresAt > Date.now())) && (b.tasksLeft == null || b.tasksLeft > 0));
}

function useBoosterRound(value) {
  const list = state.activeBoosters || [];
  const idx = list.findIndex(b => b.value === value && b.expiresAt === "round");
  if (idx >= 0) {
    list.splice(idx, 1);
    saveProgress();
  }
}

function clearRoundBoosters() {
  state.activeBoosters = (state.activeBoosters || []).filter(b => b.expiresAt !== "round");
  saveProgress();
}

function consumeSkillBoost(skillId) {
  const list = state.activeBoosters || [];
  const b = list.find(x => x.value && x.value.startsWith("skillXp_") && x.skillId === skillId && x.tasksLeft > 0);
  if (b) {
    b.tasksLeft--;
    if (b.tasksLeft <= 0) list.splice(list.indexOf(b), 1);
    saveProgress();
    return b.xpMul || 1.5;
  }
  return 1;
}

function getSkillBoostMul(skillId) {
  const b = getBooster("skillXp_" + skillId) || (state.activeBoosters || []).find(x => x.skillId === skillId && x.tasksLeft > 0);
  return b ? (b.xpMul || 1.5) : 1;
}

function canUseFreeHintToday() {
  if (!(state.purchasedItems || []).includes("island_lamp")) return false;
  const today = getTodayKey();
  if (state.lastFreeHintDate === today) return false;
  return true;
}

function useFreeHintToday() {
  state.lastFreeHintDate = getTodayKey();
  saveProgress();
}

function updateStreak() {
  const today = getTodayKey();
  const last = state.lastPlayDate;
  if (last === today) return;
  if (!last) {
    state.streakDays = 1;
    state.lastPlayDate = today;
    saveProgress();
    return;
  }
  const lastDate = new Date(last);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    state.streakDays = (state.streakDays || 0) + 1;
  } else if (diffDays > 1) {
    state.streakDays = 1;
  }
  state.lastPlayDate = today;
  saveProgress();
}

function checkTitles() {
  TITLES.forEach(t => {
    if (!state.unlockedTitles.includes(t.id) && t.check(state)) {
      state.unlockedTitles.push(t.id);
      saveProgress();
      showToast("Новый титул: " + t.name + " " + t.icon);
    }
  });
}

function getStrongestStat() {
  let best = null;
  let bestXp = -1;
  HERO_STATS_CONFIG.forEach(s => {
    const xp = state.heroStats?.[s.key] || 0;
    if (xp > bestXp) { bestXp = xp; best = s; }
  });
  return best;
}

function getSelectedTitle() {
  if (state.selectedTitle) {
    const t = TITLES.find(x => x.id === state.selectedTitle);
    if (t && state.unlockedTitles.includes(t.id)) return t;
  }
  return null;
}

function resetDailyMissionsIfNeeded() {
  const today = getTodayKey();
  if (state.dailyMissionsReset !== today) {
    state.dailyMissionsReset = today;
    state.dailyMissionsProgress = { correct: 0, levels: 0, statLevels: 0 };
    state.dailyMissionsClaimed = [];
    state.dailyLevelsPlayed = {};
    state.labSuggestedThisSession = false;
    saveProgress();
  }
}

function getNextStoryQuest() {
  const completed = state.completedQuests || [];
  for (let i = 0; i < STORY_QUESTS.length; i++) {
    if (!completed.includes(STORY_QUESTS[i].id)) return STORY_QUESTS[i];
  }
  return null;
}

function checkStoryQuests() {
  const completed = state.completedQuests || [];
  for (let i = 0; i < STORY_QUESTS.length; i++) {
    const q = STORY_QUESTS[i];
    if (completed.includes(q.id)) continue;
    const prevDone = i === 0 || completed.includes(STORY_QUESTS[i - 1].id);
    if (!prevDone) break;
    if (q.check(state)) {
      state.completedQuests.push(q.id);
      state.coins += q.reward;
      saveProgress();
      showToast(`${q.title}! +${q.reward} 💰`);
      successSound.play().catch(() => {});
    }
  }
}

function addDailyProgress(key, amount = 1) {
  resetDailyMissionsIfNeeded();
  state.dailyMissionsProgress[key] = (state.dailyMissionsProgress[key] || 0) + amount;
  saveProgress();
}

function checkDailyMissions() {
  resetDailyMissionsIfNeeded();
  const prog = state.dailyMissionsProgress || {};
  const claimed = state.dailyMissionsClaimed || [];
  DAILY_MISSIONS.forEach(m => {
    if (claimed.includes(m.id)) return;
    const val = prog[m.progressKey] || 0;
    if (val >= m.target) {
      state.dailyMissionsClaimed.push(m.id);
      state.coins += m.reward;
      saveProgress();
      showToast(`Миссия: ${m.title}! +${m.reward} 💰`);
      successSound.play().catch(() => {});
    }
  });
}

function addHeroStatCorrect(levelId) {
  const stat = LEVEL_TO_STAT[levelId];
  if (stat && state.heroStats) {
    addDailyProgress("correct", 1);
    const before = getHeroStatLevel(stat);
    const mul = getSkillBoostMul(levelId);
    state.heroStats[stat] = (state.heroStats[stat] || 0) + Math.round(2 * mul);
    if (mul > 1) consumeSkillBoost(levelId);
    saveProgress();
    const after = getHeroStatLevel(stat);
    if (after >= MAX_STAT_LEVEL && before < MAX_STAT_LEVEL) {
      const cfg = HERO_STATS_CONFIG.find(s => s.key === stat);
      if (cfg?.visual) showToast("Новая экипировка: " + cfg.visual.name + " " + cfg.visual.emoji);
      addDailyProgress("statLevels", 1);
    }
  }
}

function addHeroStatWrong() {
  if (state.heroStats) {
    showToast("Смелость +1! Ты попробовал! 💪");
    const before = getHeroStatLevel("courage");
    state.heroStats.courage = (state.heroStats.courage || 0) + 1;
    saveProgress();
    const after = getHeroStatLevel("courage");
    if (after >= MAX_STAT_LEVEL && before < MAX_STAT_LEVEL) {
      const cfg = HERO_STATS_CONFIG.find(s => s.key === "courage");
      if (cfg?.visual) showToast("Новая экипировка: " + cfg.visual.name + " " + cfg.visual.emoji);
      addDailyProgress("statLevels", 1);
    }
  }
}

function addHeroStatFromLevel(levelId, stars) {
  const stat = LEVEL_TO_STAT[levelId];
  if (stat && state.heroStats && stars > 0) {
    addDailyProgress("correct", stars);
    const before = getHeroStatLevel(stat);
    state.heroStats[stat] = (state.heroStats[stat] || 0) + stars * 2;
    saveProgress();
    const after = getHeroStatLevel(stat);
    if (after >= MAX_STAT_LEVEL && before < MAX_STAT_LEVEL) {
      const cfg = HERO_STATS_CONFIG.find(s => s.key === stat);
      if (cfg?.visual) showToast("Новая экипировка: " + cfg.visual.name + " " + cfg.visual.emoji);
      addDailyProgress("statLevels", 1);
    }
  }
}

function getHeroStatLevel(statKey) {
  const xp = state.heroStats?.[statKey] || 0;
  return Math.min(MAX_STAT_LEVEL, 1 + Math.floor(xp / XP_PER_STAT_LEVEL));
}

function getHeroStatProgress(statKey) {
  const xp = state.heroStats?.[statKey] || 0;
  const level = getHeroStatLevel(statKey);
  if (level >= MAX_STAT_LEVEL) return { current: XP_PER_STAT_LEVEL, need: XP_PER_STAT_LEVEL, xp };
  const xpInLevel = xp % XP_PER_STAT_LEVEL;
  return { current: xpInLevel, need: XP_PER_STAT_LEVEL, xp };
}

function getHeroVisualBadges() {
  return HERO_STATS_CONFIG
    .filter(s => getHeroStatLevel(s.key) >= MAX_STAT_LEVEL)
    .map(s => s.visual);
}

function getHeroAvatarWithBadges() {
  const icon = getCharacterDisplayIcon();
  const badges = getHeroVisualBadges();
  if (badges.length === 0) return icon;
  const badgesHtml = badges.map(b => `<span class="hero-badge" title="${b.name}">${b.emoji}</span>`).join("");
  return `<span class="hero-avatar-wrap"><span class="hero-main-icon">${icon}</span><span class="hero-badges">${badgesHtml}</span></span>`;
}

function getTodayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function isModuleUnlocked(moduleId) {
  if (["metaskill", "math", "russian", "reading"].includes(moduleId)) return true;
  const meta = (state.completedMetaLessons || []).length;
  const reading = (state.readingTextsCompleted || []).length;
  const stars = state.totalStars || 0;
  switch (moduleId) {
    case "wordproblems": return meta >= 1 && reading >= 1;
    case "memory": return stars >= 5;
    case "logic": return stars >= 10;
    case "attention": return stars >= 15;
    case "reaction": return stars >= 20;
    default: return true;
  }
}

function getModuleUnlockHint(moduleId) {
  const stars = state.totalStars || 0;
  switch (moduleId) {
    case "wordproblems": return "Сначала пройди 1 урок в Поляне Мудрости и 1 текст на Берегу историй — они помогут!";
    case "memory": return "Нужно 5 звёзд на карте. Решай задания в Математике и Русском!";
    case "logic": return "Нужно 10 звёзд. Продолжай собирать Светлячков!";
    case "attention": return "Нужно 15 звёзд. Ты почти у цели!";
    case "reaction": return "Нужно 20 звёзд. Осталось совсем немного!";
    default: return "";
  }
}

function getUnlockedMapLevelsCount() {
  let n = 0;
  MAP_LEVELS.forEach(lvl => { if (isModuleUnlocked(lvl.id)) n++; });
  return n;
}

function getIslandBrightness() {
  const ids = MAP_LEVELS.map(l => l.id);
  const total = ids.length * 3;
  let earned = 0;
  ids.forEach(id => { earned += Math.min(3, state.levelStars?.[id] || 0); });
  return Math.round((earned / total) * 100);
}

function inferErrorCause(levelId, errorType, userAnswer, correctAnswer) {
  if (levelId === "math" && userAnswer != null && correctAnswer != null) {
    const u = parseInt(userAnswer, 10);
    const c = parseInt(correctAnswer, 10);
    if (!Number.isNaN(u) && !Number.isNaN(c) && Math.abs(u - c) <= 1) return "carelessness";
  }
  return "understanding";
}

function logError(levelId, errorType, options) {
  state.errorLog = state.errorLog || [];
  const opts = typeof options === "string" ? { questionId: options } : (options || {});
  const subskillId = opts.subskillId || null;
  const userAnswer = opts.userAnswer != null ? opts.userAnswer : null;
  const correctAnswer = opts.correctAnswer != null ? opts.correctAnswer : null;
  const cause = opts.cause != null ? opts.cause : inferErrorCause(levelId, errorType, userAnswer, correctAnswer);
  state.errorLog.push({
    levelId,
    errorType: errorType || levelId,
    subskillId,
    questionId: opts.questionId || "",
    userAnswer,
    correctAnswer,
    cause,
    timestamp: Date.now()
  });
  if (state.errorLog.length > ERROR_LOG_MAX) state.errorLog.shift();
  state.weeklyErrors = (state.weeklyErrors || 0) + 1;
  saveProgress();
}

function getErrorStats() {
  const log = state.errorLog || [];
  const byLevel = {};
  const byKey = {};
  const byCause = { carelessness: 0, understanding: 0 };
  log.forEach(e => {
    byLevel[e.levelId] = (byLevel[e.levelId] || 0) + 1;
    const key = e.subskillId ? e.subskillId : e.levelId + "_" + (e.errorType || e.levelId);
    byKey[key] = (byKey[key] || 0) + 1;
    if (e.cause) byCause[e.cause] = (byCause[e.cause] || 0) + 1;
  });
  return { byLevel, byKey, byCause, total: log.length };
}

function getWeakSubskills() {
  const log = state.errorLog || [];
  const countBy = {};
  log.forEach(e => {
    const key = e.subskillId ? e.subskillId : (e.levelId + "_" + (e.errorType || e.levelId));
    if (!countBy[key]) countBy[key] = { levelId: e.levelId, subskillId: e.subskillId || null, errorType: e.errorType || e.levelId, count: 0 };
    countBy[key].count++;
  });
  return Object.values(countBy)
    .filter(x => x.count >= WEAK_TOPIC_THRESHOLD)
    .sort((a, b) => b.count - a.count);
}

function getTopRecommendation() {
  const weak = getWeakSubskills();
  if (weak.length === 0) return null;
  const top = weak[0];
  const key = top.subskillId || (top.levelId + "_" + top.errorType);
  const message = ERROR_RECOMMENDATIONS[key] || ERROR_RECOMMENDATIONS[top.levelId] || "Давай ещё раз потренируемся?";
  return { message, levelId: top.levelId, subskillId: top.subskillId, errorType: top.errorType };
}

function getLevelIdForSubskill(skillId, subskillId) {
  if (skillId === "attention") return subskillId === "memory_pairs" ? "memory" : "attention";
  return skillId;
}

function getNextStepRecommendation() {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const cutoffLongAgo = now - RECOMMEND_DAYS_SINCE_PRACTICE * dayMs;

  const fromErrors = getTopRecommendation();
  if (fromErrors) {
    const key = fromErrors.subskillId || (fromErrors.levelId + "_" + fromErrors.errorType);
    const msg = ERROR_RECOMMENDATIONS[key] || ERROR_RECOMMENDATIONS[fromErrors.levelId] || "Давай ещё раз потренируемся?";
    return {
      reason: "errors",
      message: msg,
      mentorTip: "Когда что-то не получается — нормально потренироваться ещё. Каждая попытка считаются.",
      levelId: fromErrors.levelId,
      subskillId: fromErrors.subskillId
    };
  }

  let bestStability = { score: 100, skillId: null, subskillId: null };
  let bestLongAgo = { age: 0, skillId: null, subskillId: null };
  Object.keys(SUBSKILLS_DEFAULT).forEach(skillId => {
    if (skillId === "metaskill") return;
    const def = SUBSKILLS_DEFAULT[skillId];
    Object.keys(def).forEach(subId => {
      const entry = state.subskillProgress?.[skillId]?.[subId];
      if (!entry || entry.total == null || entry.total < 3) return;
      const stability = getSubskillStability(skillId, subId);
      if (stability != null && stability < RECOMMEND_STABILITY_MAX && stability >= 0) {
        if (stability < bestStability.score) {
          bestStability = { score: stability, skillId, subskillId: subId };
        }
      }
      const lastAt = entry.lastPracticedAt;
      if (lastAt != null && lastAt < cutoffLongAgo) {
        const age = now - lastAt;
        if (age > bestLongAgo.age) {
          bestLongAgo = { age, skillId, subskillId: subId };
        }
      } else if ((entry.total || 0) > 0 && (lastAt == null || lastAt === undefined)) {
        bestLongAgo = { age: Infinity, skillId, subskillId: subId };
      }
    });
  });

  if (bestStability.skillId) {
    const name = SUBSKILL_NAMES[bestStability.subskillId] || bestStability.subskillId;
    const levelId = getLevelIdForSubskill(bestStability.skillId, bestStability.subskillId);
    return {
      reason: "stability",
      message: "Давай закрепим: «" + name + "»?",
      mentorTip: "Повторение помогает навыку стать уверенным. Ты уже пробовал — теперь закрепи!",
      levelId,
      subskillId: bestStability.subskillId
    };
  }

  if (bestLongAgo.skillId) {
    const name = SUBSKILL_NAMES[bestLongAgo.subskillId] || bestLongAgo.subskillId;
    const levelId = getLevelIdForSubskill(bestLongAgo.skillId, bestLongAgo.subskillId);
    return {
      reason: "long_ago",
      message: "Давно не заходили в «" + name + "». Заглянем?",
      mentorTip: "Навыки любят, когда к ним возвращаются. Короткая тренировка — и ты снова в форме!",
      levelId,
      subskillId: bestLongAgo.subskillId
    };
  }

  return null;
}

function getWeakTopics() {
  const stats = getErrorStats();
  return Object.entries(stats.byLevel)
    .filter(([, c]) => c >= WEAK_TOPIC_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

function ensureSubskillProgress() {
  const def = SUBSKILLS_DEFAULT;
  Object.keys(def).forEach(skillId => {
    if (!state.subskillProgress[skillId]) state.subskillProgress[skillId] = {};
    Object.keys(def[skillId]).forEach(subId => {
      const d = def[skillId][subId];
      if (!state.subskillProgress[skillId][subId]) {
        state.subskillProgress[skillId][subId] = "completed" in d ? { completed: d.completed } : { correct: 0, total: 0 };
      }
    });
  });
}

function addSubskillProgress(skillId, subskillId, isCorrect) {
  if (!state.subskillProgress) state.subskillProgress = JSON.parse(JSON.stringify(SUBSKILLS_DEFAULT));
  const skill = state.subskillProgress[skillId];
  if (!skill) return;
  let entry = skill[subskillId];
  if (!entry) {
    entry = skillId === "metaskill" ? { completed: false } : { correct: 0, total: 0 };
    skill[subskillId] = entry;
  }
  const oldLevel = getSubskillLevel(skillId, subskillId);
  if (skillId === "metaskill") {
    if (isCorrect) entry.completed = true;
  } else {
    entry.total = (entry.total || 0) + 1;
    if (isCorrect) entry.correct = (entry.correct || 0) + 1;
    if (!entry.lastAttempts) entry.lastAttempts = [];
    entry.lastAttempts.push(isCorrect);
    if (entry.lastAttempts.length > STAGE_LAST_ATTEMPTS_SIZE) entry.lastAttempts.shift();
    if (entry.total >= 5 && (entry.baselineTotal == null || entry.baselineTotal === undefined)) {
      entry.baselineCorrect = entry.correct;
      entry.baselineTotal = entry.total;
    }
    entry.lastPracticedAt = Date.now();
    state.weeklyAttempts = (state.weeklyAttempts || 0) + 1;
    if (isCorrect) state.weeklyCorrect = (state.weeklyCorrect || 0) + 1;
  }
  const newLevel = getSubskillLevel(skillId, subskillId);
  if (newLevel === 3 && oldLevel < 3) {
    const statKey = (KNOWLEDGE_SKILLS.find(s => s.id === skillId) || {}).statKey || "mind";
    state.heroStats = state.heroStats || {};
    state.heroStats[statKey] = (state.heroStats[statKey] || 0) + APPLIED_STAGE_HERO_BONUS;
    showToast("Применил! Сила героя +" + APPLIED_STAGE_HERO_BONUS + " ✨");
  }
  saveProgress();
}

function getSubskillLevel(skillId, subskillId) {
  const skill = state.subskillProgress?.[skillId];
  if (!skill) return 0;
  const entry = skill[subskillId];
  if (!entry) return 0;
  if (skillId === "metaskill") return entry.completed ? 1 : 0;
  const total = entry.total || 0;
  const correct = entry.correct || 0;
  if (total === 0) return 0;
  const ratio = correct / total;
  if (ratio >= STAGE_CONFIG.applied.minRatio && total >= STAGE_CONFIG.applied.minTotal) return 3;
  if (ratio >= STAGE_CONFIG.consolidated.minRatio && total >= STAGE_CONFIG.consolidated.minTotal) return 2;
  if (ratio >= STAGE_CONFIG.learned.minRatio && total >= STAGE_CONFIG.learned.minTotal) return 1;
  return 0;
}

function getSubskillStage(skillId, subskillId) {
  const lvl = getSubskillLevel(skillId, subskillId);
  if (skillId === "metaskill") return lvl ? "applied" : "none";
  if (lvl === 0) return "none";
  if (lvl === 1) return "learned";
  if (lvl === 2) return "consolidated";
  return "applied";
}

function getSubskillNeedsReinforcement(skillId, subskillId) {
  if (skillId === "metaskill") return false;
  const skill = state.subskillProgress?.[skillId];
  const entry = skill?.[subskillId];
  const last = entry?.lastAttempts;
  if (!last || last.length < 3) return false;
  const stage = getSubskillStage(skillId, subskillId);
  if (stage !== "consolidated" && stage !== "applied") return false;
  const correctInLast = last.filter(Boolean).length;
  return correctInLast <= STAGE_REINFORCE_THRESHOLD;
}

// ——— Панель роста навыков (образовательные метрики) ———
function getSubskillSuccessRate(skillId, subskillId) {
  const skill = state.subskillProgress?.[skillId];
  const entry = skill?.[subskillId];
  if (!entry || entry.total == null || entry.total === 0) return 0;
  return Math.round((entry.correct || 0) / entry.total * 100);
}

function getSubskillBaselineRate(skillId, subskillId) {
  const skill = state.subskillProgress?.[skillId];
  const entry = skill?.[subskillId];
  if (!entry || !entry.baselineTotal) return null;
  return Math.round((entry.baselineCorrect || 0) / entry.baselineTotal * 100);
}

function getSubskillStability(skillId, subskillId) {
  const skill = state.subskillProgress?.[skillId];
  const entry = skill?.[subskillId];
  const last = entry?.lastAttempts;
  if (!last || last.length === 0) return null;
  const correct = last.filter(Boolean).length;
  return Math.round((correct / last.length) * 100);
}

function getSubskillErrorTrend(subskillId) {
  const log = state.errorLog || [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last7 = log.filter(e => (e.subskillId === subskillId) && e.timestamp >= now - 7 * day);
  const prev7 = log.filter(e => (e.subskillId === subskillId) && e.timestamp >= now - 14 * day && e.timestamp < now - 7 * day);
  return { last7: last7.length, prev7: prev7.length, fewer: last7.length < prev7.length };
}

function getSubskillGrowth(skillId, subskillId) {
  const became = getSubskillSuccessRate(skillId, subskillId);
  const was = getSubskillBaselineRate(skillId, subskillId);
  if (was == null) return { was: null, became, improved: null };
  return { was, became, improved: became > was };
}

function getWeekKey() {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.getFullYear() + "-" + String(start.getMonth() + 1).padStart(2, "0") + "-" + String(start.getDate()).padStart(2, "0");
}

function getRank() {
  const stars = state.totalStars || 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (stars >= RANKS[i].minStars) return RANKS[i];
  }
  return RANKS[0];
}

function getCharacterDisplayIcon() {
  const hero = getCharacter();
  if (state.characterSkin) {
    const skin = SHOP_ITEMS.find(i => i.type === "heroSkin" && i.value === state.characterSkin && i.heroId === hero.id);
    if (skin) return skin.icon;
  }
  return hero.icon;
}

function checkDailyAndWeekly() {
  const today = getTodayKey();
  if (state.lastLoginDate !== today) {
    state.lastLoginDate = today;
    state.coins += DAILY_BONUS_COINS;
    saveProgress();
    showToast("Ежедневный бонус: +" + DAILY_BONUS_COINS + " 💰");
  }
  const weekKey = getWeekKey();
  if (state.weekStartDate !== weekKey) {
    if (state.weekStartDate && (state.weeklyAttempts > 0 || state.weeklyStars > 0)) {
      state.weeklySnapshots = state.weeklySnapshots || [];
      state.weeklySnapshots.push({
        weekKey: state.weekStartDate,
        weeklyCorrect: state.weeklyCorrect || 0,
        weeklyAttempts: state.weeklyAttempts || 0,
        weeklyErrors: state.weeklyErrors || 0,
        weeklyStars: state.weeklyStars || 0
      });
      if (state.weeklySnapshots.length > 5) state.weeklySnapshots = state.weeklySnapshots.slice(-5);
    }
    state.weekStartDate = weekKey;
    state.weeklyStars = 0;
    state.weeklyCorrect = 0;
    state.weeklyAttempts = 0;
    state.weeklyErrors = 0;
    state.weeklyRewardClaimed = false;
    saveProgress();
    if (state.weeklySnapshots.length > 0) showToast("Готов отчёт за неделю! Посмотри в Профиле 📊");
  }
  if ((state.weeklyStars || 0) >= WEEKLY_GOAL_STARS && !state.weeklyRewardClaimed) {
    state.weeklyRewardClaimed = true;
    state.coins += WEEKLY_REWARD_COINS;
    saveProgress();
    showToast("Еженедельная цель достигнута! +" + WEEKLY_REWARD_COINS + " 💰");
  }
}

function getCharacter() {
  if (state.character && state.character.icon) return state.character;
  const def = HEROES[0];
  return { id: def.id, name: def.name, icon: def.icon };
}

function getCharacterLevel() {
  const stars = state.totalStars || 0;
  return Math.min(MAX_CHARACTER_LEVEL, 1 + Math.floor(stars / STARS_PER_CHARACTER_LEVEL));
}

function getCharacterProgress() {
  const stars = state.totalStars || 0;
  const level = getCharacterLevel();
  if (level >= MAX_CHARACTER_LEVEL) return { current: STARS_PER_CHARACTER_LEVEL, need: STARS_PER_CHARACTER_LEVEL };
  const starsInLevel = stars % STARS_PER_CHARACTER_LEVEL;
  return { current: starsInLevel, need: STARS_PER_CHARACTER_LEVEL };
}

function applyBackground() {
  document.body.classList.remove("bg-ocean", "bg-space", "bg-forest", "bg-candy");
  if (state.selectedBackground && state.selectedBackground !== "default") {
    document.body.classList.add("bg-" + state.selectedBackground);
  }
}

function render(content) {
  document.getElementById("app").innerHTML = "";
  document.getElementById("app").appendChild(content);
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function addCoins(amount) {
  let mult = (state.selectedExtras && state.selectedExtras.includes("doubleCoins")) ? 2 : 1;
  const charLevel = getCharacterLevel();
  if (charLevel >= 2) amount += 1;
  state.coins += Math.floor(amount * mult);
  state.totalCorrect++;
  checkAchievements();
  saveProgress();
}

function addStars(levelId, count) {
  const weekKey = getWeekKey();
  if (state.weekStartDate !== weekKey) {
    if (state.weekStartDate && (state.weeklyAttempts > 0 || state.weeklyStars > 0)) {
      state.weeklySnapshots = state.weeklySnapshots || [];
      state.weeklySnapshots.push({
        weekKey: state.weekStartDate,
        weeklyCorrect: state.weeklyCorrect || 0,
        weeklyAttempts: state.weeklyAttempts || 0,
        weeklyErrors: state.weeklyErrors || 0,
        weeklyStars: state.weeklyStars || 0
      });
      if (state.weeklySnapshots.length > 5) state.weeklySnapshots = state.weeklySnapshots.slice(-5);
    }
    state.weekStartDate = weekKey;
    state.weeklyStars = 0;
    state.weeklyCorrect = 0;
    state.weeklyAttempts = 0;
    state.weeklyErrors = 0;
    state.weeklyRewardClaimed = false;
  }
  state.weeklyStars = (state.weeklyStars || 0) + count;
  state.totalStars += count;
  state.levelStars[levelId] = Math.max(state.levelStars[levelId] || 0, count);
  checkAchievements();
  saveProgress();
}

function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!state.achievements.includes(a.id) && a.check(state)) {
      state.achievements.push(a.id);
      showToast(`Достижение: ${a.name}! ${a.icon}`);
    }
  });
}

let confettiIntervalId = null;

function launchConfetti() {
  const canvas = document.getElementById("confetti");
  if (!canvas) return;
  successSound.play().catch(() => {});
  if (confettiIntervalId) {
    clearInterval(confettiIntervalId);
    confettiIntervalId = null;
  }
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#fbbf24", "#a855f7"];
  const pieces = [];
  for (let i = 0; i < 80; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 6 + 2,
      c: colors[Math.floor(Math.random() * colors.length)]
    });
  }
  let frame = 0;
  const maxFrames = 120;
  confettiIntervalId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += 3;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    frame++;
    if (frame >= maxFrames) {
      clearInterval(confettiIntervalId);
      confettiIntervalId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, 20);
}

function robotSvg() {
  return `
    <svg viewBox="0 0 100 120">
      <defs>
        <linearGradient id="rob" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#818cf8"/></linearGradient>
      </defs>
      <rect x="25" y="35" width="50" height="55" rx="8" fill="url(#rob)"/>
      <rect x="15" y="50" width="15" height="25" rx="4" fill="url(#rob)"/>
      <rect x="70" y="50" width="15" height="25" rx="4" fill="url(#rob)"/>
      <circle cx="35" cy="55" r="6" fill="#fbbf24"/>
      <circle cx="65" cy="55" r="6" fill="#fbbf24"/>
      <rect x="40" y="70" width="20" height="8" rx="2" fill="#1e293b"/>
      <circle cx="50" cy="25" r="12" fill="url(#rob)"/>
      <circle cx="47" cy="22" r="3" fill="#fbbf24"/>
      <circle cx="53" cy="22" r="3" fill="#fbbf24"/>
    </svg>
  `;
}

// ——— Приветствие ———
function welcomeScreen() {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <h1>🧠 Умный старт</h1>
    <p style="text-align:center;">На Острове Знаний живёт <strong>Путаница</strong> — она питается незнанием. Ты и твой герой будете собирать <strong>Светлячков знания</strong> и возвращать свет!</p>
    <div class="hint-box">
      <span class="hint-icon">💡</span>
      <span>Напиши своё имя и нажми «Дальше» — потом выберешь героя для спасения Острова.</span>
    </div>
    <input id="nameInput" type="text" placeholder="Как тебя зовут?" maxlength="20">
    <div style="display:flex; gap:10px; margin-top:16px;">
      <button id="startBtn" class="btn-primary" style="flex:1; padding:18px;">Дальше</button>
      <button id="legendBtnWelcome" class="btn-secondary" style="padding:18px 16px;" title="Прочитать легенду">📖</button>
    </div>
  `;
  div.querySelector("#legendBtnWelcome").onclick = () => legendScreen();
  div.querySelector("#startBtn").onclick = () => {
    const n = div.querySelector("#nameInput").value.trim();
    if (n) {
      state.name = n;
      saveProgress();
      chooseHeroScreen();
    } else {
      showToast("Напиши своё имя 😊");
    }
  };
  return div;
}

// ——— Выбор героя (персонажа) ———
function chooseHeroScreen() {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <h1>Выбери героя</h1>
    <p style="text-align:center;">Ты будешь помогать ему спасти Остров Знаний. Каждый Светлячок (правильный ответ) делает героя сильнее!</p>
    <div class="heroes-grid" id="heroesGrid"></div>
    <button class="btn-secondary" id="backName">← Изменить имя</button>
  `;
  const grid = div.querySelector("#heroesGrid");
  HEROES.forEach(h => {
    const card = document.createElement("div");
    card.className = "hero-card";
    card.innerHTML = `
      <div class="hero-card-icon">${h.icon}</div>
      <div class="hero-card-name">${h.name}</div>
      <div class="hero-card-desc">${h.desc}</div>
    `;
    card.onclick = () => {
      state.character = { id: h.id, name: h.name, icon: h.icon };
      state.avatar = h.icon;
      saveProgress();
      successSound.play().catch(() => {});
      showToast(h.name + " готов к приключению!");
      if (!state.hasSeenIntro) {
        introScreen();
      } else {
        mapScreen();
      }
    };
    grid.appendChild(card);
  });
  div.querySelector("#backName").onclick = () => render(welcomeScreen());
  render(div);
}

// ——— Инструкция: концепция игры (после выбора героя) ———
function introScreen() {
  const hero = getCharacter();
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <h2>🗺 Как устроен Остров Знаний</h2>
    <p style="text-align:center; color:var(--text-muted);">Кратко — что тебя ждёт</p>
    <div class="legend-text" style="margin:16px 0;">
      <p><strong>Карта.</strong> На карте — 6 областей Острова: Математика, Русский, Память, Логика, Внимание, Реакция. Нажимай на область и выбирай сложность. Чем больше заданий выполнишь — тем больше откроется областей.</p>
      <p><strong>Светлячки и звёзды.</strong> Каждый правильный ответ — это Светлячок 💡. В конце уровня ты получаешь звёзды (1–3). Звёзды прокачивают ${hero.name} и открывают новые зоны.</p>
      <p><strong>Монеты 💰</strong> даются за правильные ответы и квесты. Их можно тратить в Магазине (аватарки, фоны, подсказки).</p>
      <p><strong>Кнопки вверху:</strong> 🧠 Учусь — уроки «как учиться»; 📚 Чтение и 📝 Задачи — тексты и разбор задач; 🗺 Навыки — твоя карта прогресса. Квесты и Достижения — сюжет и награды.</p>
      <p><em>Твоя цель — собирать Светлячков и освещать Остров. Чем больше понимаешь — тем ярче свет!</em></p>
    </div>
    <button id="introStartBtn" class="btn-primary" style="width:100%; padding:18px;">На карту — начать!</button>
  `;
  div.querySelector("#introStartBtn").onclick = () => {
    state.hasSeenIntro = true;
    saveProgress();
    mapScreen();
  };
  render(div);
}

// ——— Карта приключения ———
function mapScreen() {
  checkDailyAndWeekly();
  updateStreak();
  levelsThisSession = 0;
  resetDailyMissionsIfNeeded();
  checkStoryQuests();
  checkDailyMissions();
  checkTitles();
  const div = document.createElement("div");
  div.className = "card";
  const hero = getCharacter();
  const heroIcon = getCharacterDisplayIcon();
  const charLevel = getCharacterLevel();
  const progress = getCharacterProgress();
  const progressPct = progress.need ? (progress.current / progress.need) * 100 : 100;
  const rank = getRank();
  const weeklyStars = state.weeklyStars || 0;
  const prog = state.dailyMissionsProgress || {};
  const claimed = state.dailyMissionsClaimed || [];
  const dailyRows = DAILY_MISSIONS.map(m => {
    const val = Math.min(m.target, prog[m.progressKey] || 0);
    const done = claimed.includes(m.id);
    return `<div class="daily-mission ${done ? "claimed" : ""}"><span>${m.icon} ${m.title}</span><span>${done ? "✓" : val + "/" + m.target}</span></div>`;
  }).join("");
  const brightness = getIslandBrightness();

  div.innerHTML = `
    <div class="top-bar">
      <div class="top-bar-left">
        <div class="currency" title="Монеты"><span class="coin-icon">💰</span> ${state.coins}</div>
        <div class="currency stars" title="Звёзды">⭐ ${state.totalStars}</div>
        <span class="rank-badge" title="Ранг: ${rank.name}">${rank.icon} ${rank.name}</span>
        ${(state.streakDays || 0) > 0 ? `<span class="streak-badge" title="Дней подряд">🔥 ${state.streakDays}</span>` : ""}
      </div>
      <div class="top-bar-right">
        <div class="top-bar-group" title="Профиль и магазин">
          <button class="btn-top" id="heroBtn">${heroIcon} Герой</button>
          <button class="btn-top" id="profileBtn">👤</button>
          <button class="btn-top" id="shopBtn">🛒</button>
        </div>
        <div class="top-bar-group" title="Квесты и достижения">
          <button class="btn-top" id="questBtn">📜 Квесты</button>
          <button class="btn-top" id="achBtn">🏅</button>
        </div>
        <div class="top-bar-group" title="Уроки и навыки">
          <button class="btn-top" id="metaBtn">🧠 Учусь</button>
          <button class="btn-top" id="readBtn">📚 Чтение</button>
          <button class="btn-top" id="wordBtn">📝 Задачи</button>
          <button class="btn-top" id="knowledgeBtn">🗺 Навыки</button>
        </div>
        <div class="top-bar-group">
          <button class="btn-top" id="legendBtn">📖 Легенда</button>
          <button class="btn-top" id="resetBtn" title="Сбросить прогресс">🔄</button>
        </div>
      </div>
    </div>
    <div class="weekly-goal-bar">
      <span>📅 Звёзды за неделю: ${weeklyStars} / ${WEEKLY_GOAL_STARS}</span>
      <div class="weekly-progress"><div class="weekly-progress-fill" style="width:${Math.min(100, (weeklyStars / WEEKLY_GOAL_STARS) * 100)}%"></div></div>
    </div>
    <div class="daily-missions-bar">
      <span class="daily-missions-title">✨ Ежедневные миссии</span>
      <div class="daily-missions-list">${dailyRows}</div>
    </div>
    <div class="map-hero-block">
      <div class="map-hero-avatar">${getHeroAvatarWithBadges()}</div>
      <div class="map-hero-info">
        <h2 style="margin:0;">Привет, ${state.name}!</h2>
        <p style="margin:4px 0 0;">Помоги <strong>${hero.name}</strong> спасти Остров Знаний</p>
        <div class="map-hero-level">Уровень героя: ${charLevel} ${charLevel >= MAX_CHARACTER_LEVEL ? "★ макс" : ""}</div>
        ${charLevel < MAX_CHARACTER_LEVEL ? `<div class="hero-xp-bar"><div class="hero-xp-fill" style="width:${progressPct}%"></div></div><div class="hero-xp-text">${progress.current} / ${progress.need} звёзд до уровня ${charLevel + 1}</div>` : ""}
      </div>
    </div>
    <div class="hint-box">
      <span class="hint-icon">🗺️</span>
      <span>Выбери локацию на Острове — выполняй задания, собирай Светлячков. Остров освещён на <strong>${brightness}%</strong> — чем больше знаешь, тем ярче свет!</span>
    </div>
    ${(function(){
      const rec = getNextStepRecommendation();
      if (!rec || state.labSuggestedThisSession) return "";
      return `<div class="next-step-card">
        <div class="next-step-title">🎯 Твой следующий шаг</div>
        <p class="next-step-message">${rec.message}</p>
        ${rec.mentorTip ? `<p class="next-step-mentor">💬 Совет наставника: ${rec.mentorTip}</p>` : ""}
        <div class="next-step-actions">
          <button class="btn-primary" id="practiceBtn">Попробовать</button>
          <button class="btn-secondary" id="dismissPracticeBtn">Потом</button>
        </div>
      </div>`;
    })()}
    <div class="adventure-map">
      <div class="map-path"></div>
      <div class="map-nodes" id="mapNodes"></div>
    </div>
  `;
  const nodes = div.querySelector("#mapNodes");
  MAP_LEVELS.forEach((lvl, i) => {
    const unlocked = isModuleUnlocked(lvl.id);
    const hint = !unlocked ? getModuleUnlockHint(lvl.id) : "";
    const node = document.createElement("div");
    node.className = "map-node" + (unlocked ? " completed" : " locked");
    node.innerHTML = `
      <div class="node-icon">${lvl.icon}</div>
      <div>
        <div class="node-title">${lvl.location || lvl.title}</div>
        <div class="node-desc">${unlocked ? lvl.desc : hint || `Нужно ${MODULE_UNLOCK[lvl.id]?.minStars || "?"} звёзд`}</div>
      </div>
    `;
    if (unlocked) {
      node.onclick = () => difficultySelectScreen(lvl.id);
    }
    nodes.appendChild(node);
  });
  const practiceBtn = div.querySelector("#practiceBtn");
  const dismissPracticeBtn = div.querySelector("#dismissPracticeBtn");
  if (practiceBtn) {
    const rec = getNextStepRecommendation();
    practiceBtn.onclick = () => {
      state.labSuggestedThisSession = true;
      saveProgress();
      const id = rec ? rec.levelId : null;
      if (id === "math" || id === "russian") difficultySelectScreen(id);
      else if (id === "logic") logicScreen();
      else if (id === "attention") attentionScreen();
      else if (id === "memory") memoryScreen();
      else if (id === "reading") readingScreen();
      else if (id === "wordproblems") wordProblemsScreen(true);
      else if (id === "reaction") reactionScreen();
      else mapScreen();
    };
  }
  if (dismissPracticeBtn) dismissPracticeBtn.onclick = () => { state.labSuggestedThisSession = true; saveProgress(); mapScreen(); };
  div.querySelector("#heroBtn").onclick = heroScreen;
  div.querySelector("#profileBtn").onclick = profileScreen;
  div.querySelector("#shopBtn").onclick = shopScreen;
  div.querySelector("#questBtn").onclick = questsScreen;
  div.querySelector("#legendBtn").onclick = legendScreen;
  div.querySelector("#metaBtn").onclick = () => metaskillScreen();
  div.querySelector("#readBtn").onclick = () => readingScreen();
  div.querySelector("#wordBtn").onclick = wordProblemsScreen;
  div.querySelector("#knowledgeBtn").onclick = knowledgeMapScreen;
  div.querySelector("#achBtn").onclick = achievementsScreen;
  div.querySelector("#resetBtn").onclick = () => {
    const hero = getCharacter();
    showConfirm({
      title: "Начать заново?",
      text: `Весь прогресс, монеты и звёзды пропадут. ${hero.name} начнёт путь заново.`,
      yesLabel: "Да, начать заново",
      noLabel: "Остаться",
      icon: "🔄",
      onYes: () => { localStorage.removeItem("smartStart"); location.reload(); }
    });
  };
  render(div);
}

function getDifficultyDesc(levelId, d) {
  if (levelId === "memory") return `${d.memoryPairs || 4} пар · награда ${d.coinMul === 1 ? "обычная" : d.coinMul > 1 ? "больше" : "меньше"}`;
  if (levelId === "logic") return `${d.logicQuestions || 3} вопроса · награда ${d.coinMul === 1 ? "обычная" : d.coinMul > 1 ? "больше" : "меньше"}`;
  if (levelId === "attention") return `${d.attentionItems || 4} предмета · награда ${d.coinMul === 1 ? "обычная" : d.coinMul > 1 ? "больше" : "меньше"}`;
  if (levelId === "reaction") return "Одна попытка · чем быстрее — тем больше звёзд";
  return `${d.questions} заданий · награда ${d.coinMul === 1 ? "обычная" : d.coinMul > 1 ? "больше" : "меньше"}`;
}

function difficultySelectScreen(levelId) {
  const lvl = MAP_LEVELS.find(l => l.id === levelId);
  if (!lvl) return startLevel(levelId);
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <button class="btn-back" id="backMap">⬅ На карту</button>
    <h2 style="text-align:center;">${lvl.icon} ${lvl.location || lvl.title}</h2>
    <p style="text-align:center;">Выбери сложность. Чем сложнее — тем больше Светлячков!</p>
    <div class="difficulty-grid" id="diffGrid"></div>
  `;
  DIFFICULTY.forEach(d => {
    const btn = document.createElement("button");
    btn.className = "difficulty-btn";
    btn.innerHTML = `
      <span class="difficulty-icon">${d.icon}</span>
      <span class="difficulty-name">${d.name}</span>
      <span class="difficulty-desc">${getDifficultyDesc(levelId, d)}</span>
    `;
    btn.onclick = () => {
      currentDifficulty = d;
      startLevel(levelId);
    };
    div.querySelector("#diffGrid").appendChild(btn);
  });
  div.querySelector("#backMap").onclick = mapScreen;
  render(div);
}

function startLevel(id) {
  if (!currentDifficulty) currentDifficulty = DIFFICULTY[1];
  if (id === "math") startMathQuiz();
  else if (id === "russian") startRussianQuiz();
  else if (id === "memory") memoryScreen();
  else if (id === "logic") logicScreen();
  else if (id === "attention") attentionScreen();
  else if (id === "reaction") reactionScreen();
}

// ——— Экран героя (прокачка) ———
function heroScreen() {
  const hero = getCharacter();
  const heroIcon = getCharacterDisplayIcon();
  const level = getCharacterLevel();
  const progress = getCharacterProgress();
  const progressPct = progress.need ? (progress.current / progress.need) * 100 : 100;
  const div = document.createElement("div");
  div.className = "card";
  if (state.selectedExtras && state.selectedExtras.includes("goldFrame")) div.classList.add("gold-frame");
  const extras = state.selectedExtras || [];
  const exLife = extras.includes("extraLife");
  const exFrame = extras.includes("goldFrame");
  const exDouble = extras.includes("doubleCoins");
  const abilityRows = HERO_ABILITIES.map(a => {
    const un = level >= a.level;
    return `<div class="hero-ability ${un ? "unlocked" : ""}">${a.icon} ${a.text} ${un ? "✓" : "— уровень " + a.level}</div>`;
  }).join("");
  const statRows = HERO_STATS_CONFIG.map(s => {
    const prog = getHeroStatProgress(s.key);
    const lvl = getHeroStatLevel(s.key);
    const pct = prog.need ? (prog.current / prog.need) * 100 : 100;
    return `
      <div class="hero-stat-row">
        <span class="hero-stat-info">${s.icon} ${s.name} <strong>${lvl}/${MAX_STAT_LEVEL}</strong></span>
        <div class="hero-xp-bar hero-stat-bar"><div class="hero-xp-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join("");
  const equipmentRows = HERO_STATS_CONFIG.map(s => {
    const lvl = getHeroStatLevel(s.key);
    const un = lvl >= MAX_STAT_LEVEL;
    const v = s.visual;
    return `<span class="hero-equip-item ${un ? "unlocked" : ""}" title="${v.name}${un ? "" : " — достигни 5 уровня"}">${v.emoji}</span>`;
  }).join("");
  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅ Назад</button>
    <h2 style="text-align:center;">${heroIcon} Мой герой</h2>
    <div class="hero-screen-avatar ${level >= 12 ? "hero-glow" : ""}">${getHeroAvatarWithBadges()}</div>
    <p style="text-align:center; font-size:1.4rem; font-weight:800;">${hero.name}</p>
    <p style="text-align:center; color:var(--text-muted);">Уровень: <strong>${level}</strong> ${level >= MAX_CHARACTER_LEVEL ? "(максимум!)" : ""}</p>
    ${level < MAX_CHARACTER_LEVEL ? `
      <div class="hero-xp-bar"><div class="hero-xp-fill" style="width:${progressPct}%"></div></div>
      <p style="text-align:center; font-size:0.95rem;">${progress.current} / ${progress.need} звёзд до уровня ${level + 1}</p>
    ` : ""}
    <h3 style="margin-top:20px;">🎽 Экипировка героя</h3>
    <p style="font-size:0.9rem; color:var(--text-muted);">Достигни 5 уровня характеристики — получишь предмет!</p>
    <div class="hero-equipment">${equipmentRows}</div>
    <h3 style="margin-top:20px;">📊 Характеристики</h3>
    <p style="font-size:0.9rem; color:var(--text-muted);">Задания прокачивают разные умения героя</p>
    <div class="hero-stats-list">${statRows}</div>
    <p style="text-align:center; margin-top:12px; font-size:0.9rem;">Ум — математика, русский. Внимательность — память, внимание. Логика — логика. Скорость — реакция. Смелость растёт от попыток!</p>
    <h3 style="margin-top:20px;">✨ Умения героя</h3>
    <div class="hero-abilities">${abilityRows}</div>
    <h3 style="margin-top:16px;">📚 Лавка Знаний</h3>
    <div class="hero-abilities">
      <div class="hero-ability ${exLife ? "unlocked" : ""}">❤️ Сердечко героя ${exLife ? "✓" : "— купи в Лавке"}</div>
      <div class="hero-ability ${exFrame ? "unlocked" : ""}">🖼️ Золотая рамка ${exFrame ? "✓" : "— купи в Лавке"}</div>
      <div class="hero-ability ${exDouble ? "unlocked" : ""}">💰 Сокровище острова ${exDouble ? "✓" : "— купи в Лавке"}</div>
    </div>
    <button class="btn-primary" id="toShopBtn" style="width:100%; margin-top:16px;">📚 Открыть Лавку Знаний</button>
    <button class="btn-secondary" id="heroBackBtn" style="width:100%; margin-top:8px;">На карту</button>
  `;
  div.querySelector("#backBtn").onclick = mapScreen;
  div.querySelector("#heroBackBtn").onclick = mapScreen;
  div.querySelector("#toShopBtn").onclick = shopScreen;
  render(div);
}

// ——— Профиль ученика ———
function profileScreen() {
  const div = document.createElement("div");
  div.className = "card profile-card";
  if (state.selectedExtras && state.selectedExtras.includes("goldFrame")) {
    div.classList.add("gold-frame");
  }
  const hero = getCharacter();
  const charLevel = getCharacterLevel();
  const strongestStat = getStrongestStat();
  const strongestText = strongestStat && (state.heroStats?.[strongestStat.key] || 0) > 0 ? `<p style="text-align:center; margin-top:8px; font-size:0.95rem;">Самая сильная: ${strongestStat.icon} ${strongestStat.name}</p>` : "";
  const achList = (state.achievements && state.achievements.length)
    ? state.achievements.map(id => {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        return a ? `<span class="profile-ach" title="${a.name}">${a.icon}</span>` : "";
      }).filter(Boolean).join(" ")
    : "Пока нет. Играй и получай награды!";
  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅ Назад</button>
    <h2 style="text-align:center;">👤 Мой профиль</h2>
    <div class="profile-avatar">${state.avatar}</div>
    <p style="text-align:center; font-size:1.3rem; font-weight:800;">${state.name}</p>
    <p style="text-align:center; color:var(--text-muted);">Герой: ${hero.name} · Уровень ${charLevel}</p>
    <p style="text-align:center;"><span class="rank-badge">${getRank().icon} ${getRank().name}</span></p>
    ${(state.streakDays || 0) > 0 ? `<p style="text-align:center;">🔥 Серия дней: ${state.streakDays}</p>` : ""}
    ${state.unlockedTitles?.length ? `<p style="text-align:center;">${getSelectedTitle() ? `<span class="title-badge">${getSelectedTitle().icon} ${getSelectedTitle().name}</span> ` : ""}<button class="btn-secondary" id="selectTitleBtn" style="margin-top:4px;">${getSelectedTitle() ? "Сменить" : "Выбрать титул"}</button></p>` : ""}
    <div class="profile-stats">
      <div class="profile-stat"><span class="profile-stat-val">${state.coins}</span> 💰 Монеты</div>
      <div class="profile-stat"><span class="profile-stat-val">${state.totalStars}</span> ⭐ Звёзды</div>
      <div class="profile-stat"><span class="profile-stat-val">${state.unlockedLevels}</span> / ${TOTAL_LEVELS} уровней</div>
    </div>
    ${strongestText}
    ${state.selectedExtras && state.selectedExtras.includes("goldFrame") ? `<p style="text-align:center;"><span class="profile-badge">🖼️ Золотая рамка</span></p>` : ""}
    <h3 style="margin-top:20px;">🏅 Достижения</h3>
    <div class="profile-achievements">${achList}</div>
    <button class="btn-secondary" id="weeklyReportBtn" style="width:100%; margin-top:12px;">📊 Недельный отчёт</button>
    <button class="btn-secondary" id="parentModeBtn" style="width:100%; margin-top:8px;">👨‍👩‍👧 Режим для родителей</button>
    <button class="btn-secondary" id="profileBackBtn" style="width:100%; margin-top:8px;">На карту</button>
  `;
  div.querySelector("#backBtn").onclick = mapScreen;
  div.querySelector("#profileBackBtn").onclick = mapScreen;
  div.querySelector("#weeklyReportBtn").onclick = weeklyReportScreen;
  div.querySelector("#parentModeBtn").onclick = () => showParentPinModal(parentPanelScreen);
  const selBtn = div.querySelector("#selectTitleBtn");
  if (selBtn) selBtn.onclick = () => titlesScreen();
  render(div);
}

function formatWeekLabel(weekKey) {
  if (!weekKey) return "Неделя";
  const parts = String(weekKey).split("-");
  if (parts.length >= 3) {
    const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10) - 1, d = parseInt(parts[2], 10);
    const start = new Date(y, m, d);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const d2 = end.getDate(), m2 = end.getMonth();
    return "Неделя " + d + "–" + d2 + " " + (months[m2] || "");
  }
  return weekKey;
}

function getAverageStability() {
  let sum = 0, count = 0;
  Object.keys(SUBSKILLS_DEFAULT).forEach(skillId => {
    if (skillId === "metaskill") return;
    Object.keys(SUBSKILLS_DEFAULT[skillId]).forEach(subId => {
      const s = getSubskillStability(skillId, subId);
      if (s != null) { sum += s; count++; }
    });
  });
  return count ? Math.round(sum / count) : null;
}

function weeklyReportScreen() {
  const snapshots = state.weeklySnapshots || [];
  const last = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const prev = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;
  const div = document.createElement("div");
  div.className = "card";
  let forParents = false;
  function renderReport() {
    const stability = getAverageStability();
    const currentCorrect = state.weeklyCorrect || 0;
    const currentAttempts = state.weeklyAttempts || 0;
    const currentErrors = state.weeklyErrors || 0;
    if (!last) {
      div.innerHTML = `
        <button class="btn-back" id="backBtn">⬅ Назад</button>
        <h2>📊 Недельный отчёт</h2>
        <p style="text-align:center; color:var(--text-muted);">Пока нет отчётов за прошлые недели.</p>
        <p style="text-align:center; font-size:0.95rem;">Занимайся в приложении — через неделю здесь появится твой первый отчёт!</p>
        ${currentAttempts > 0 ? `<p style="text-align:center; margin-top:16px; font-size:0.9rem;">На этой неделе пока: правильно ${currentCorrect} из ${currentAttempts} попыток.</p>` : ""}
        <button class="btn-secondary" id="backToProfile" style="width:100%; margin-top:20px;">В профиль</button>
      `;
      div.querySelector("#backBtn").onclick = profileScreen;
      div.querySelector("#backToProfile").onclick = profileScreen;
      render(div);
      return;
    }
    const rate = last.weeklyAttempts > 0 ? Math.round((last.weeklyCorrect / last.weeklyAttempts) * 100) : 0;
    const errorsDown = prev && last.weeklyErrors < prev.weeklyErrors;
    const correctUp = prev && last.weeklyCorrect > prev.weeklyCorrect;
    const starsLine = (last.weeklyStars != null && last.weeklyStars > 0) ? `<p class="report-hero">⭐ Звёзд за неделю: <strong>${last.weeklyStars}</strong></p>` : "";
    const childHtml = `
      <div class="report-block report-child">
        <div class="report-week">${formatWeekLabel(last.weekKey)}</div>
        ${starsLine}
        <p class="report-hero">Ты ответил правильно <strong>${last.weeklyCorrect}</strong> раз из <strong>${last.weeklyAttempts}</strong> попыток. Ошибок было ${last.weeklyErrors}.</p>
        ${rate >= 70 ? "<p class=\"report-growth\">🌟 Отличная устойчивость!</p>" : rate >= 50 ? "<p class=\"report-growth\">Продолжай закреплять — ты на верном пути!</p>" : "<p class=\"report-growth\">Каждая попытка делает тебя сильнее. Продолжай!</p>"}
        ${prev ? (errorsDown ? "<p class=\"report-dynamic\">↓ Ошибок меньше, чем на прошлой неделе — рост!</p>" : correctUp ? "<p class=\"report-dynamic\">↑ Больше правильных ответов — ты растешь!</p>" : "<p class=\"report-dynamic\">Стабильная неделя. Так держать!</p>") : ""}
        ${stability != null ? `<p class="report-stability">Устойчивость навыков: ${stability}%</p>` : ""}
      </div>
    `;
    const parentHtml = `
      <div class="report-block report-parent">
        <div class="report-week">${formatWeekLabel(last.weekKey)}</div>
        <ul class="report-list">
          <li>Правильных ответов: <strong>${last.weeklyCorrect}</strong></li>
          <li>Всего попыток: <strong>${last.weeklyAttempts}</strong></li>
          <li>Ошибок: <strong>${last.weeklyErrors}</strong></li>
          ${last.weeklyStars != null && last.weeklyStars > 0 ? `<li>Звёзд за неделю: <strong>${last.weeklyStars}</strong></li>` : ""}
          ${last.weeklyAttempts > 0 ? `<li>Успешность: <strong>${Math.round((last.weeklyCorrect / last.weeklyAttempts) * 100)}%</strong></li>` : ""}
          ${stability != null ? `<li>Устойчивость (среднее по поднавыкам): ${stability}%</li>` : ""}
          ${prev ? `<li>Динамика: ${errorsDown ? "снижение ошибок" : correctUp ? "рост правильных ответов" : "стабильно"} по сравнению с предыдущей неделей</li>` : ""}
        </ul>
      </div>
    `;
    div.innerHTML = `
      <button class="btn-back" id="backBtn">⬅ Назад</button>
      <h2>📊 Недельный отчёт</h2>
      <p style="text-align:center; color:var(--text-muted); font-size:0.9rem;">${forParents ? "Краткая сводка для родителей" : "Твоя неделя — твой рост"}</p>
      ${forParents ? parentHtml : childHtml}
      <button class="btn-secondary" id="toggleReport" style="width:100%; margin-top:16px;">${forParents ? "Версия для ребёнка" : "Версия для родителей"}</button>
      <button class="btn-secondary" id="backToProfile" style="width:100%; margin-top:8px;">В профиль</button>
    `;
    div.querySelector("#backBtn").onclick = profileScreen;
    div.querySelector("#backToProfile").onclick = profileScreen;
    div.querySelector("#toggleReport").onclick = () => { forParents = !forParents; renderReport(); };
    render(div);
  }
  renderReport();
}

// ——— Родительская панель ———
function getParentPanelData() {
  const strongSides = [];
  const growthZones = [];
  const recommendations = [];

  const strongestStat = getStrongestStat();
  if (strongestStat && (state.heroStats?.[strongestStat.key] || 0) > 0) {
    strongSides.push({ type: "stat", text: "Самая развитая область", detail: strongestStat.icon + " " + strongestStat.name });
  }
  Object.keys(SUBSKILLS_DEFAULT).forEach(skillId => {
    if (skillId === "metaskill") return;
    const skillInfo = KNOWLEDGE_SKILLS.find(s => s.id === skillId);
    Object.keys(SUBSKILLS_DEFAULT[skillId]).forEach(subId => {
      const name = SUBSKILL_NAMES[subId] || subId;
      const level = getSubskillLevel(skillId, subId);
      const stability = getSubskillStability(skillId, subId);
      const total = (state.subskillProgress?.[skillId]?.[subId]?.total) || 0;
      if (total >= 3 && (level === 3 || (stability != null && stability >= 80))) {
        strongSides.push({ type: "subskill", text: name, detail: skillInfo ? skillInfo.icon + " " + skillInfo.name : "" });
      }
      if (total >= 2 && (stability != null && stability < 60)) {
        growthZones.push({ type: "stability", text: "Стоит закрепить", detail: name });
      }
    });
  });
  const seenGrowth = new Set(growthZones.map(g => g.detail));
  const weak = getWeakSubskills();
  weak.forEach(w => {
    const name = SUBSKILL_NAMES[w.subskillId] || w.subskillId || w.levelId;
    if (!seenGrowth.has(name)) {
      seenGrowth.add(name);
      growthZones.push({ type: "practice", text: "Есть куда расти", detail: name });
    }
  });
  const next = getNextStepRecommendation();
  if (next) {
    const name = next.subskillId ? (SUBSKILL_NAMES[next.subskillId] || next.subskillId) : next.levelId;
    const reasonText = next.reason === "errors" ? "Полезно потренировать" : next.reason === "stability" ? "Закрепить навык" : "Вернуться к теме";
    recommendations.push({ text: reasonText + ": «" + name + "». Короткие занятия в приложении помогут ребёнку увереннее справляться с заданиями." });
  }
  const topErr = getTopRecommendation();
  if (topErr && (!next || topErr.subskillId !== next.subskillId)) {
    const name = SUBSKILL_NAMES[topErr.subskillId] || topErr.subskillId || topErr.levelId;
    recommendations.push({ text: "Обратите внимание на «" + name + "». Предложите ребёнку пройти уровень ещё раз — так навык лучше закрепится." });
  }
  const avgStability = getAverageStability();
  if (avgStability != null && recommendations.length === 0) {
    recommendations.push({ text: "Ребёнок занимается стабильно. Поддерживайте регулярные короткие сессии — они дают лучший эффект, чем редкие длинные." });
  }
  const snapshots = state.weeklySnapshots || [];
  const lastWeek = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  return { strongSides, growthZones, recommendations, lastWeek, avgStability: avgStability };
}

function parentPanelScreen() {
  const data = getParentPanelData();
  const div = document.createElement("div");
  div.className = "card parent-panel";
  const strongList = data.strongSides.length
    ? data.strongSides.map(s => `<li class="parent-item">${s.type === "stat" ? s.text + ": " + s.detail : s.detail + " — " + s.text}</li>`).join("")
    : "<li class=\"parent-item parent-empty\">Пока мало данных. Пусть ребёнок поиграет в уровнях — сильные стороны появятся здесь.</li>";
  const growthList = data.growthZones.length
    ? data.growthZones.map(g => `<li class="parent-item"><span class="parent-detail">${g.detail}</span> — ${g.text}</li>`).join("")
    : "<li class=\"parent-item parent-empty\">Явных зон роста не выделено. Продолжайте заниматься.</li>";
  const recList = data.recommendations.length
    ? data.recommendations.map(r => `<li class="parent-recommendation">${r.text}</li>`).join("")
    : "<li class=\"parent-item parent-empty\">Продолжайте регулярные занятия. Новые рекомендации появятся по мере прогресса.</li>";
  const weekBlock = data.lastWeek
    ? `<div class="parent-block"><h3 class="parent-block-title">📊 За прошлую неделю</h3><p class="parent-week-text">Правильных ответов: <strong>${data.lastWeek.weeklyCorrect}</strong>, попыток: <strong>${data.lastWeek.weeklyAttempts}</strong>. ${data.lastWeek.weeklyAttempts > 0 ? "Успешность: " + Math.round((data.lastWeek.weeklyCorrect / data.lastWeek.weeklyAttempts) * 100) + "%." : ""}</p></div>`
    : "";
  div.innerHTML = `
    <button class="btn-back" id="parentBackBtn">⬅ Назад</button>
    <h2 class="parent-panel-title">👨‍👩‍👧 Режим для родителей</h2>
    <p class="parent-panel-subtitle">Краткая сводка развития. Акцент на прогрессе, а не на ошибках.</p>
    <div class="parent-block">
      <h3 class="parent-block-title">💪 Сильные стороны</h3>
      <ul class="parent-list">${strongList}</ul>
    </div>
    <div class="parent-block">
      <h3 class="parent-block-title">🌱 Зоны роста</h3>
      <ul class="parent-list">${growthList}</ul>
    </div>
    <div class="parent-block">
      <h3 class="parent-block-title">💡 Рекомендации</h3>
      <ul class="parent-list parent-recommendations">${recList}</ul>
    </div>
    ${weekBlock}
    <button class="btn-secondary" id="parentPanelBack" style="width:100%; margin-top:16px;">В профиль</button>
  `;
  div.querySelector("#parentBackBtn").onclick = profileScreen;
  div.querySelector("#parentPanelBack").onclick = profileScreen;
  render(div);
}

function titlesScreen() {
  const div = document.createElement("div");
  div.className = "card";
  const unlocked = state.unlockedTitles || [];
  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅ Назад</button>
    <h2>🏷️ Титулы</h2>
    <p style="color:var(--text-muted); font-size:0.95rem;">Выбери титул — он будет отображаться в профиле</p>
    <div class="titles-list" id="titlesList"></div>
  `;
  TITLES.forEach(t => {
    const has = unlocked.includes(t.id);
    const sel = state.selectedTitle === t.id;
    const item = document.createElement("div");
    item.className = "quest-item" + (sel ? " completed" : "") + (has ? "" : " locked");
    item.innerHTML = `
      <span class="quest-icon">${has ? t.icon : "🔒"}</span>
      <div class="quest-info">
        <div class="quest-title">${t.name}</div>
        <div class="quest-text">${has ? (sel ? "Выбрано ✓" : "Нажми, чтобы выбрать") : "Пока не открыт"}</div>
      </div>
    `;
    if (has) item.onclick = () => {
      state.selectedTitle = sel ? null : t.id;
      saveProgress();
      showToast(sel ? "Титул снят" : "Титул: " + t.name);
      profileScreen();
    };
    div.querySelector("#titlesList").appendChild(item);
  });
  div.querySelector("#backBtn").onclick = profileScreen;
  render(div);
}

function finishLevel(levelId, stars, coinsEarned, extraBonuses) {
  clearRoundBoosters();
  resetDailyMissionsIfNeeded();
  state.dailyLevelsPlayed[levelId] = (state.dailyLevelsPlayed[levelId] || 0) + 1;
  const isRepeat = (state.dailyLevelsPlayed[levelId] || 0) >= 2;
  const diff = currentDifficulty || DIFFICULTY[1];
  stars = Math.min(3, Math.round(stars * diff.starMul));
  coinsEarned = Math.round((coinsEarned || 0) * diff.coinMul);
  if (isRepeat) coinsEarned = Math.round(coinsEarned * REPEAT_LEVEL_BONUS);
  if (extraBonuses) {
    if (extraBonuses.fullLives) coinsEarned += FULL_LIVES_BONUS_COINS;
    if (extraBonuses.noHint) coinsEarned += NO_HINT_BONUS_COINS;
  }
  if (["memory", "reaction"].includes(levelId) && stars > 0) {
    addHeroStatFromLevel(levelId, stars);
  }
  const sp = state.skillProgress[levelId] || { stars: 0, correct: 0, total: 0, lastPracticed: getTodayKey() };
  sp.stars = Math.max(sp.stars || 0, stars);
  sp.lastPracticed = getTodayKey();
  if (typeof currentCorrect === "number" && currentQuestions && currentQuestions.length) {
    sp.correct = (sp.correct || 0) + currentCorrect;
    sp.total = (sp.total || 0) + currentQuestions.length;
  }
  state.skillProgress[levelId] = sp;
  if (stars >= 1) addDailyProgress("levels", 1);
  levelsThisSession++;
  const hero = getCharacter();
  const levelBefore = getCharacterLevel();
  try {
    addStars(levelId, stars);
    if (coinsEarned) addCoins(coinsEarned);
    state.unlockedLevels = Math.max(state.unlockedLevels || 1, getUnlockedMapLevelsCount());
    state.gameLevel = Math.max(state.gameLevel || 1, state.unlockedLevels);
    const levelAfter = getCharacterLevel();
    if (levelAfter > levelBefore) launchConfetti();
    else if (stars >= 2) launchConfetti();
    checkStoryQuests();
    checkDailyMissions();
  } catch (e) {
    console.warn("finishLevel reward error", e);
  }
  const levelAfter = getCharacterLevel();
  const characterLevelUp = levelAfter > levelBefore ? levelAfter : 0;
  const bossAvailable = stars === 3 && BOSS_LEVEL_IDS.includes(levelId) && !(state.completedBosses || []).includes(levelId);
  if (extraBonuses) extraBonuses.repeatBonus = isRepeat;
  if (bossAvailable) {
    const lvl = MAP_LEVELS.find(l => l.id === levelId);
    showConfirm({
      title: "Испытание Путаницы!",
      text: `Ты получил 3 звезды! Путаница устроила ловушку в ${lvl.title}. Реши 5 сложных вопросов подряд без ошибок — получишь +${BOSS_REWARD_COINS} монет!`,
      yesLabel: "Попробовать",
      noLabel: "Потом",
      icon: "👾",
      onYes: () => startBossChallenge(levelId),
      onNo: () => showLevelResult(levelId, stars, coinsEarned, characterLevelUp, extraBonuses)
    });
  } else {
    showLevelResult(levelId, stars, coinsEarned, characterLevelUp, extraBonuses);
  }
}

function showLevelResult(levelId, stars, coinsEarned, characterLevelUp, extraBonuses) {
  const lvl = MAP_LEVELS.find(l => l.id === levelId);
  const hero = getCharacter();
  let bonusText = "";
  if (extraBonuses) {
    const parts = [];
    if (extraBonuses.fullLives) parts.push("все жизни сохранены +" + FULL_LIVES_BONUS_COINS + " 💰");
    if (extraBonuses.noHint) parts.push("без подсказки +" + NO_HINT_BONUS_COINS + " 💰");
    if (extraBonuses.repeatBonus) parts.push("бонус за повтор +20%");
    if (parts.length) bonusText = "<p style=\"text-align:center; font-size:0.9rem; color:var(--accent-2);\">Бонус: " + parts.join(", ") + "</p>";
  }
  const locName = lvl.location || lvl.title;
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <h2 style="text-align:center;">${lvl.icon} ${locName}</h2>
    <p style="text-align:center;">${hero.name} получил награду за ${lvl.title}!</p>
    <div class="result-stars">
      <span class="star ${stars >= 1 ? '' : 'empty'}">⭐</span>
      <span class="star ${stars >= 2 ? '' : 'empty'}">⭐</span>
      <span class="star ${stars >= 3 ? '' : 'empty'}">⭐</span>
    </div>
    ${stars > 0 ? `<p style="text-align:center; font-size:0.95rem;">+${stars} звёзд для героя</p>` : ""}
    ${characterLevelUp ? `<p style="text-align:center; font-weight:800; color:var(--accent-2);">🎉 ${hero.name} вырос! Уровень ${characterLevelUp}!</p>` : ""}
    ${bonusText}
    ${coinsEarned ? `<div class="reward-popup"><span class="reward-item">💰 +${coinsEarned}</span></div>` : ""}
    <p style="text-align:center;">${extraBonuses?.repeatBonus ? "Закрепление — путь к мастерству! +20% монет" : stars === 3 ? pickRandom(RESULT_PHRASES_3) : stars >= 1 ? pickRandom(RESULT_PHRASES_1) : "В следующий раз получится! Ты сможешь! 💪"}</p>
    ${levelsThisSession >= 2 ? `<div class="rest-suggestion"><span class="rest-icon">💤</span><p>Ты уже прошёл ${levelsThisSession} уровней! Герой немного устал — отдохни, Остров подождёт.</p></div>` : ""}
    <p style="text-align:center; font-size:0.95rem; color:var(--text-muted); margin-bottom:16px;">Нажми кнопку ниже, чтобы вернуться на карту.</p>
    <button id="mapBtn" class="btn-primary" style="width:100%; padding:18px;">${levelsThisSession >= 2 ? "На карту (отдохнуть)" : "На карту"}</button>
    ${stars >= 1 ? `<button id="repeatBtn" class="btn-secondary" style="width:100%; padding:14px; margin-top:10px;">🔄 Закрепи уровень — пройди ещё раз</button>` : ""}
  `;
  div.querySelector("#mapBtn").onclick = mapScreen;
  const repeatBtn = div.querySelector("#repeatBtn");
  if (repeatBtn) repeatBtn.onclick = () => difficultySelectScreen(levelId);
  render(div);
}

// ——— Испытание Путаницы (босс) ———
function generateBossMathQuestions() {
  const q = [];
  for (let i = 0; i < 5; i++) {
    let a = random(8, 25), b = random(5, 20);
    const op = Math.random() > 0.5 ? "+" : "−";
    if (op === "−" && a < b) [a, b] = [b, a];
    const correct = op === "+" ? a + b : a - b;
    const wrongs = new Set([correct]);
    while (wrongs.size < 4) wrongs.add(correct + random(-6, 6) || correct + 1);
    const subskillId = op === "+" ? "math_add_big" : "math_sub_big";
    q.push({ text: `${a} ${op} ${b} = ?`, options: shuffle(Array.from(wrongs)), correctIndex: 0, subskillId });
    const o = q[q.length - 1].options;
    q[q.length - 1].correctIndex = o.indexOf(correct);
  }
  return q;
}

function startBossChallenge(levelId) {
  if (levelId === "math") {
    currentQuestions = generateBossMathQuestions();
    currentQuestionIndex = 0;
    currentCorrect = 0;
    currentLives = 1;
    maxLivesThisRound = 1;
    bossMathScreen();
  } else if (levelId === "russian") {
    const harderWords = [...RUSSIAN_WORDS];
    currentQuestions = shuffle(harderWords).slice(0, 5).map(w => {
      const options = shuffle([w.correct, ...w.wrong]);
      return { text: `Вставь букву: ${w.word}`, options, correctIndex: options.indexOf(w.correct) };
    });
    currentQuestionIndex = 0;
    currentCorrect = 0;
    currentLives = 1;
    maxLivesThisRound = 1;
    bossRussianScreen();
  } else {
    mapScreen();
  }
}

function bossMathScreen() {
  if (currentQuestionIndex >= currentQuestions.length || currentLives <= 0) {
    const won = currentCorrect >= 5;
    state.completedBosses = state.completedBosses || [];
    if (won) {
      state.completedBosses.push("math");
      state.coins += BOSS_REWARD_COINS;
      saveProgress();
      launchConfetti();
    }
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = won ? `
      <h2 style="text-align:center;">👾 Победа над Путаницей!</h2>
      <p style="text-align:center;">Ты прошёл испытание в Математике!</p>
      <p style="text-align:center; font-size:2rem;">+${BOSS_REWARD_COINS} 💰</p>
      <button id="mapBtn" class="btn-primary" style="width:100%; padding:18px;">На карту</button>
    ` : `
      <h2 style="text-align:center;">Почти получилось!</h2>
      <p style="text-align:center;">Путаница победила в этот раз. Попробуй снова, когда получишь 3 звезды!</p>
      <button id="mapBtn" class="btn-primary" style="width:100%; padding:18px;">На карту</button>
    `;
    div.querySelector("#mapBtn").onclick = mapScreen;
    render(div);
    return;
  }
  const q = currentQuestions[currentQuestionIndex];
  const div = document.createElement("div");
  div.className = "card boss-card";
  div.innerHTML = `
    <div class="boss-header">👾 Испытание Путаницы · Математика</div>
    <div class="lives" id="lives">❤️</div>
    <div class="quiz-progress-text">Вопрос ${currentQuestionIndex + 1} из 5</div>
    <h2 style="text-align:center;">🔢 ${q.text}</h2>
    <div class="options-grid" id="opts"></div>
    <div id="fb"></div>
  `;
  q.options.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.textContent = o;
    b.onclick = () => {
      div.querySelectorAll(".option-btn").forEach(x => x.classList.add("disabled"));
      addSubskillProgress("math", q.subskillId || "math_add_big", i === q.correctIndex);
      if (i === q.correctIndex) {
        b.classList.add("correct");
        currentCorrect++;
        addHeroStatCorrect("math");
        successSound.play().catch(() => {});
        div.querySelector("#fb").className = "answer-feedback correct-msg";
        div.querySelector("#fb").textContent = "Верно!";
        setTimeout(() => { currentQuestionIndex++; bossMathScreen(); }, 800);
      } else {
        b.classList.add("wrong");
        div.querySelectorAll(".option-btn")[q.correctIndex].classList.add("correct");
        currentLives = 0;
        playWrongSound();
        div.querySelector("#fb").className = "answer-feedback wrong-msg";
        div.querySelector("#fb").textContent = "Путаница победила...";
        setTimeout(() => bossMathScreen(), 1200);
      }
    };
    div.querySelector("#opts").appendChild(b);
  });
  render(div);
}

function bossRussianScreen() {
  if (currentQuestionIndex >= currentQuestions.length || currentLives <= 0) {
    const won = currentCorrect >= 5;
    state.completedBosses = state.completedBosses || [];
    if (won) {
      state.completedBosses.push("russian");
      state.coins += BOSS_REWARD_COINS;
      saveProgress();
      launchConfetti();
    }
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = won ? `
      <h2 style="text-align:center;">👾 Победа над Путаницей!</h2>
      <p style="text-align:center;">Ты прошёл испытание в Русском языке!</p>
      <p style="text-align:center; font-size:2rem;">+${BOSS_REWARD_COINS} 💰</p>
      <button id="mapBtn" class="btn-primary" style="width:100%; padding:18px;">На карту</button>
    ` : `
      <h2 style="text-align:center;">Почти получилось!</h2>
      <p style="text-align:center;">Путаница победила в этот раз.</p>
      <button id="mapBtn" class="btn-primary" style="width:100%; padding:18px;">На карту</button>
    `;
    div.querySelector("#mapBtn").onclick = mapScreen;
    render(div);
    return;
  }
  const q = currentQuestions[currentQuestionIndex];
  const div = document.createElement("div");
  div.className = "card boss-card";
  div.innerHTML = `
    <div class="boss-header">👾 Испытание Путаницы · Русский язык</div>
    <div class="lives" id="lives">❤️</div>
    <div class="quiz-progress-text">Вопрос ${currentQuestionIndex + 1} из 5</div>
    <h2 style="text-align:center;">📚 ${q.text}</h2>
    <div class="options-grid" id="opts"></div>
    <div id="fb"></div>
  `;
  q.options.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.textContent = o;
    b.onclick = () => {
      div.querySelectorAll(".option-btn").forEach(x => x.classList.add("disabled"));
      if (i === q.correctIndex) {
        b.classList.add("correct");
        currentCorrect++;
        addHeroStatCorrect("russian");
        successSound.play().catch(() => {});
        div.querySelector("#fb").className = "answer-feedback correct-msg";
        div.querySelector("#fb").textContent = "Верно!";
        setTimeout(() => { currentQuestionIndex++; bossRussianScreen(); }, 800);
      } else {
        b.classList.add("wrong");
        div.querySelectorAll(".option-btn")[q.correctIndex].classList.add("correct");
        currentLives = 0;
        playWrongSound();
        div.querySelector("#fb").className = "answer-feedback wrong-msg";
        div.querySelector("#fb").textContent = "Путаница победила...";
        setTimeout(() => bossRussianScreen(), 1200);
      }
    };
    div.querySelector("#opts").appendChild(b);
  });
  render(div);
}

// ——— Математика ———
function generateOneMathQuestion(preferSubskillId) {
  const types = ["math_add_small", "math_sub_small", "math_add_big", "math_sub_big"];
  const subskillId = preferSubskillId && types.includes(preferSubskillId) ? preferSubskillId : pickRandom(types);
  const isAdd = subskillId.includes("add");
  const isBig = subskillId.includes("big");
  const [maxA, maxB] = isBig ? [25, 20] : [12, 12];
  let a = random(1, maxA), b = random(1, maxB);
  const op = isAdd ? "+" : "−";
  if (op === "−" && a < b) [a, b] = [b, a];
  const correct = op === "+" ? a + b : a - b;
  const wrongs = new Set([correct]);
  const range = isBig ? 6 : 4;
  while (wrongs.size < 4) wrongs.add(correct + random(-range, range) || correct + 1);
  const options = shuffle(Array.from(wrongs));
  return { text: `${a} ${op} ${b} = ?`, options, correctIndex: options.indexOf(correct), subskillId };
}

function generateMathQuestions(count) {
  const n = count || QUESTIONS_PER_ROUND;
  const q = [];
  const weakMath = getWeakSubskills().filter(w => w.levelId === "math" && w.subskillId && w.subskillId.startsWith("math_"));
  for (let i = 0; i < n; i++) {
    const prefer = (i < weakMath.length && weakMath[i]) ? weakMath[i].subskillId : null;
    q.push(generateOneMathQuestion(prefer));
  }
  return shuffle(q);
}

function startMathQuiz() {
  const diff = currentDifficulty || DIFFICULTY[1];
  const qCount = diff.questions || QUESTIONS_PER_ROUND;
  currentQuestions = generateMathQuestions(qCount);
  currentQuestionIndex = 0;
  currentCorrect = 0;
  consecutiveCorrect = 0;
  consecutiveWrong = 0;
  hintUsedThisRound = false;
  freeHintUsedThisRound = false;
  lifeBoughtThisRound = false;
  shieldUsedThisRound = false;
  shieldThinkUsedThisRound = false;
  let baseLives = LIVES_START;
  if (state.selectedExtras && state.selectedExtras.includes("extraLife")) baseLives++;
  if (getCharacterLevel() >= 8) baseLives++;
  maxLivesThisRound = baseLives;
  currentLives = maxLivesThisRound;
  mathQuizScreen();
}

function mathQuizScreen() {
  if (currentQuestionIndex >= currentQuestions.length || currentLives <= 0) {
    const ratio = currentQuestions.length ? currentCorrect / currentQuestions.length : 0;
    const stars2 = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
    const extraBonuses = { fullLives: currentLives >= maxLivesThisRound, noHint: !hintUsedThisRound };
    finishLevel("math", stars2, currentCorrect * COINS_PER_CORRECT, extraBonuses);
    return;
  }
  const q = currentQuestions[currentQuestionIndex];
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <div class="top-bar"><div class="currency" id="quizCoins">💰 ${state.coins}</div><button class="btn-back" id="backBtn">⬅</button></div>
    <div class="lives" id="lives"></div>
    <div class="quiz-shop" id="quizShop">
      <button type="button" class="quiz-shop-btn" id="buyHintBtn" title="Спроси у Мудрого фонаря — уберёт 2 неправильных ответа">🏮 Мудрый фонарь ${HINT_PRICE} 💰</button>
      <button type="button" class="quiz-shop-btn" id="buyLifeBtn" title="Добавить 1 жизнь">❤️ +1 жизнь ${LIFE_PRICE} 💰</button>
    </div>
    <div class="quiz-progress-text">Вопрос ${currentQuestionIndex + 1} из ${currentQuestions.length}</div>
    <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${(currentQuestionIndex + 1) / currentQuestions.length * 100}%"></div></div>
    <h2 style="text-align:center;">🔢 Математика</h2>
    ${currentQuestionIndex === 0 ? `<div class="hint-box"><span class="hint-icon">✏️</span><span>Реши пример вверху и нажми на кнопку с правильным ответом. У тебя есть жизни (сердечки). Можно купить подсказку или жизнь за монеты!</span></div>` : ""}
    ${currentQuestionIndex === 0 && hasBooster("timeThink") ? `<div class="hint-box" style="margin-top:8px;"><span class="hint-icon">⏳</span><span>Светлячок напоминает: не спеши, перечитай вопрос!</span></div>` : ""}
    <div class="question-block"><p class="question-text">${q.text}</p></div>
    <div class="options-grid" id="opts"></div>
    <div id="fb"></div>
  `;
  q.options.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.textContent = o;
    b.dataset.optionIndex = String(i);
    b.onclick = () => onMathAnswer(div, i);
    div.querySelector("#opts").appendChild(b);
  });
  fillLives(div.querySelector("#lives"));
  setupQuizShop(div, q.correctIndex);
  div.querySelector("#backBtn").onclick = () => {
    showConfirm({
      title: "Выйти из игры?",
      text: "Ты вернёшься на карту. Прогресс этого раунда не сохранится.",
      yesLabel: "Выйти",
      noLabel: "Играть дальше",
      icon: "⬅️",
      onYes: () => mapScreen()
    });
  };
  render(div);
}

function fillLives(el) {
  if (!el) return;
  el.innerHTML = "";
  const max = typeof maxLivesThisRound !== "undefined" ? maxLivesThisRound : LIVES_START;
  for (let i = 0; i < max; i++) {
    const s = document.createElement("span");
    s.className = "heart" + (i >= currentLives ? " lost" : "");
    s.textContent = "❤️";
    el.appendChild(s);
  }
}

function setupQuizShop(container, correctIndex) {
  const coinsEl = container.querySelector("#quizCoins");
  const hintBtn = container.querySelector("#buyHintBtn");
  const lifeBtn = container.querySelector("#buyLifeBtn");

  function updateCoins() {
    if (coinsEl) coinsEl.textContent = "💰 " + state.coins;
  }

  const freeHint = !hintUsedThisRound && (canUseFreeHintToday() || hasBooster("freeHintRound") || (getCharacterLevel() >= 5 && !freeHintUsedThisRound));
  if (!hintUsedThisRound && freeHint) hintBtn.textContent = "🏮 Мудрый фонарь бесплатно";
  if (hintUsedThisRound) {
    hintBtn.disabled = true;
    hintBtn.textContent = "🏮 Фонарь использован";
    hintBtn.classList.add("used");
  } else {
    hintBtn.onclick = () => {
      const cost = freeHint ? 0 : HINT_PRICE;
      if (state.coins < cost) {
        showToast("Не хватает монет! Нужно " + HINT_PRICE + " 💰");
        return;
      }
      if (cost > 0) state.coins -= cost;
      hintUsedThisRound = true;
      if (canUseFreeHintToday()) useFreeHintToday();
      else if (hasBooster("freeHintRound")) useBoosterRound("freeHintRound");
      else if (getCharacterLevel() >= 5) freeHintUsedThisRound = true;
      saveProgress();
      updateCoins();
      hintBtn.disabled = true;
      hintBtn.textContent = "🏮 Фонарь использован";
      hintBtn.classList.add("used");
      const opts = container.querySelectorAll(".option-btn");
      const wrongIndices = [];
      opts.forEach((o, i) => { if (i !== correctIndex) wrongIndices.push(i); });
      const toHide = shuffle(wrongIndices).slice(0, 2);
      toHide.forEach(i => opts[i].classList.add("hidden"));
      showToast(freeHint ? "Подсказка! Два неверных ответа убраны ✨" : "Мудрый фонарь убрал два неправильных ответа! 🏮");
    };
  }

  if (lifeBoughtThisRound) {
    lifeBtn.disabled = true;
    lifeBtn.textContent = "❤️ Жизнь куплена";
    lifeBtn.classList.add("used");
  } else {
    lifeBtn.onclick = () => {
      if (state.coins < LIFE_PRICE) {
        showToast("Не хватает монет! Нужно " + LIFE_PRICE + " 💰");
        return;
      }
      state.coins -= LIFE_PRICE;
      lifeBoughtThisRound = true;
      currentLives++;
      maxLivesThisRound++;
      saveProgress();
      updateCoins();
      fillLives(container.querySelector("#lives"));
      lifeBtn.disabled = true;
      lifeBtn.textContent = "❤️ Жизнь куплена";
      lifeBtn.classList.add("used");
      successSound.play().catch(() => {});
      showToast("+1 жизнь!");
    };
  }
}

function onMathAnswer(container, i) {
  const q = currentQuestions[currentQuestionIndex];
  const opts = container.querySelectorAll(".option-btn");
  opts.forEach(o => o.classList.add("disabled"));
  addSubskillProgress("math", q.subskillId || "math_add_small", i === q.correctIndex);
  if (i === q.correctIndex) {
    opts[i].classList.add("correct");
    currentCorrect++;
    consecutiveCorrect++;
    addHeroStatCorrect("math");
    let comboBonus = 0;
    if (consecutiveCorrect === 3) { comboBonus = COMBO_3_BONUS; showToast("Комбо x3! +" + COMBO_3_BONUS + " 💰"); }
    else if (consecutiveCorrect === 5) { comboBonus = COMBO_5_BONUS; showToast("Комбо x5! +" + COMBO_5_BONUS + " 💰"); }
    addCoins(COINS_PER_CORRECT + comboBonus);
    successSound.play().catch(() => {});
    container.querySelector("#fb").className = "answer-feedback correct-msg";
    container.querySelector("#fb").textContent = pickRandom(PRAISE_PHRASES);
  } else {
    consecutiveWrong++;
    consecutiveCorrect = 0;
    if (consecutiveWrong >= 3 && !hintUsedThisRound) {
      hintUsedThisRound = true;
      consecutiveWrong = 0;
      opts.forEach(o => o.classList.remove("disabled"));
      const wrongIndices = [];
      opts.forEach((o, idx) => { if (idx !== q.correctIndex) wrongIndices.push(idx); });
      const toHide = shuffle(wrongIndices).slice(0, 2);
      toHide.forEach(idx => opts[idx].classList.add("hidden"));
      const hintBtn = container.querySelector("#buyHintBtn");
      if (hintBtn) { hintBtn.disabled = true; hintBtn.textContent = "🏮 Фонарь использован"; hintBtn.classList.add("used"); }
      showToast("Путаница хитрая. Давай подумаем вместе? 💡");
      container.querySelector("#fb").className = "answer-feedback correct-msg";
      container.querySelector("#fb").textContent = "Два неправильных ответа убраны. Попробуй ещё!";
      saveProgress();
      return;
    }
    opts[i].classList.add("wrong");
    opts[q.correctIndex].classList.add("correct");
    addHeroStatWrong();
    const userAns = q.options[i];
    const correctAns = q.options[q.correctIndex];
    logError("math", q.text.includes("+") ? "addition" : "subtraction", {
      questionId: q.text,
      subskillId: q.subskillId || null,
      userAnswer: userAns,
      correctAnswer: correctAns
    });
    if (hasBooster("shieldThink") && !shieldThinkUsedThisRound) {
      shieldThinkUsedThisRound = true;
      useBoosterRound("shieldThink");
      opts.forEach(o => o.classList.remove("disabled"));
      const wrongIndices = [];
      opts.forEach((o, idx) => { if (idx !== q.correctIndex) wrongIndices.push(idx); });
      shuffle(wrongIndices).slice(0, 2).forEach(idx => opts[idx].classList.add("hidden"));
      container.querySelector("#fb").className = "answer-feedback correct-msg";
      container.querySelector("#fb").textContent = "Щит размышления! Подсказка — попробуй ещё раз.";
      showToast("🛡️ Щит размышления! Жизнь не потеряна.");
      saveProgress();
      return;
    }
    if (getCharacterLevel() >= 10 && !shieldUsedThisRound) {
      shieldUsedThisRound = true;
      showToast("🛡️ Щит героя сработал!");
    } else {
      currentLives--;
    }
    playWrongSound();
    container.querySelector("#fb").className = "answer-feedback wrong-msg";
    container.querySelector("#fb").textContent = "Попробуй ещё!";
  }
  saveProgress();

  const nextIndex = currentQuestionIndex + 1;
  const quizOver = nextIndex >= currentQuestions.length || currentLives <= 0;

  setTimeout(() => {
    currentQuestionIndex = nextIndex;
    if (quizOver) {
      const ratio = currentQuestions.length ? currentCorrect / currentQuestions.length : 0;
      const stars2 = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
      const extraBonuses = { fullLives: currentLives >= maxLivesThisRound, noHint: !hintUsedThisRound };
      try {
        finishLevel("math", stars2, currentCorrect * COINS_PER_CORRECT, extraBonuses);
      } catch (err) {
        showLevelResult("math", stars2, currentCorrect * COINS_PER_CORRECT, 0, extraBonuses);
      }
    } else {
      mathQuizScreen();
    }
  }, 1100);
}

// ——— Русский ———
const RUSSIAN_WORDS = [
  { word: "Ма_ина", correct: "ш", wrong: ["ж","ч","щ"] },
  { word: "Со_нце", correct: "л", wrong: ["н","р","д"] },
  { word: "Ко_ка", correct: "ш", wrong: ["ж","ч","щ"] },
  { word: "Дру_ья", correct: "з", wrong: ["с","ж","г"] },
  { word: "Кни_а", correct: "г", wrong: ["к","х","ж"] },
  { word: "Ры_а", correct: "б", wrong: ["п","в","д"] },
  { word: "Земл_", correct: "я", wrong: ["а","е","и"] },
  { word: "Морко_ь", correct: "в", wrong: ["ф","б","п"] }
];

function startRussianQuiz() {
  const diff = currentDifficulty || DIFFICULTY[1];
  const qCount = Math.min(diff.questions || QUESTIONS_PER_ROUND, RUSSIAN_WORDS.length);
  currentQuestions = shuffle([...RUSSIAN_WORDS]).slice(0, qCount).map(w => {
    const options = shuffle([w.correct, ...w.wrong]);
    return {
      text: `Вставь букву: ${w.word}`,
      options,
      correctIndex: options.indexOf(w.correct)
    };
  });
  currentQuestionIndex = 0;
  currentCorrect = 0;
  consecutiveCorrect = 0;
  consecutiveWrong = 0;
  hintUsedThisRound = false;
  freeHintUsedThisRound = false;
  lifeBoughtThisRound = false;
  shieldUsedThisRound = false;
  let baseLives = LIVES_START;
  if (state.selectedExtras && state.selectedExtras.includes("extraLife")) baseLives++;
  if (getCharacterLevel() >= 8) baseLives++;
  maxLivesThisRound = baseLives;
  currentLives = maxLivesThisRound;
  russianQuizScreen();
}

function russianQuizScreen() {
  if (currentQuestionIndex >= currentQuestions.length || currentLives <= 0) {
    const ratio = currentQuestions.length ? currentCorrect / currentQuestions.length : 0;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
    const extraBonuses = { fullLives: currentLives >= maxLivesThisRound, noHint: !hintUsedThisRound };
    finishLevel("russian", stars, currentCorrect * COINS_PER_CORRECT, extraBonuses);
    return;
  }
  const q = currentQuestions[currentQuestionIndex];
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <div class="top-bar"><div class="currency" id="quizCoins">💰 ${state.coins}</div><button class="btn-back" id="backBtn">⬅</button></div>
    <div class="lives" id="lives"></div>
    <div class="quiz-shop" id="quizShop">
      <button type="button" class="quiz-shop-btn" id="buyHintBtn" title="Мудрый фонарь — уберёт 2 неправильных ответа">🏮 Мудрый фонарь ${HINT_PRICE} 💰</button>
      <button type="button" class="quiz-shop-btn" id="buyLifeBtn">❤️ +1 жизнь ${LIFE_PRICE} 💰</button>
    </div>
    <div class="quiz-progress-text">Вопрос ${currentQuestionIndex + 1} из ${currentQuestions.length}</div>
    <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${(currentQuestionIndex + 1) / currentQuestions.length * 100}%"></div></div>
    <h2 style="text-align:center;">📚 Русский язык</h2>
    ${currentQuestionIndex === 0 ? `<div class="hint-box"><span class="hint-icon">📖</span><span>В слове пропущена буква. Выбери букву. Можно купить подсказку или жизнь за монеты!</span></div>` : ""}
    <div class="question-block"><p class="question-text">${q.text}</p></div>
    <div class="options-grid" id="opts"></div>
    <div id="fb"></div>
  `;
  q.options.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.textContent = o;
    b.onclick = () => onRussianAnswer(div, i);
    div.querySelector("#opts").appendChild(b);
  });
  fillLives(div.querySelector("#lives"));
  setupQuizShop(div, q.correctIndex);
  div.querySelector("#backBtn").onclick = () => {
    showConfirm({
      title: "Выйти из игры?",
      text: "Ты вернёшься на карту. Прогресс этого раунда не сохранится.",
      yesLabel: "Выйти",
      noLabel: "Играть дальше",
      icon: "⬅️",
      onYes: () => mapScreen()
    });
  };
  render(div);
}

function onRussianAnswer(container, i) {
  const q = currentQuestions[currentQuestionIndex];
  const correctIdx = q.correctIndex;
  const opts = container.querySelectorAll(".option-btn");
  opts.forEach(o => o.classList.add("disabled"));
  if (i === correctIdx) {
    opts[i].classList.add("correct");
    currentCorrect++;
    consecutiveCorrect++;
    addHeroStatCorrect("russian");
    let comboBonus = 0;
    if (consecutiveCorrect === 3) { comboBonus = COMBO_3_BONUS; showToast("Комбо x3! +" + COMBO_3_BONUS + " 💰"); }
    else if (consecutiveCorrect === 5) { comboBonus = COMBO_5_BONUS; showToast("Комбо x5! +" + COMBO_5_BONUS + " 💰"); }
    addCoins(COINS_PER_CORRECT + comboBonus);
    successSound.play().catch(() => {});
    container.querySelector("#fb").className = "answer-feedback correct-msg";
    container.querySelector("#fb").textContent = pickRandom(PRAISE_PHRASES);
  } else {
    consecutiveWrong++;
    consecutiveCorrect = 0;
    if (consecutiveWrong >= 3 && !hintUsedThisRound) {
      hintUsedThisRound = true;
      consecutiveWrong = 0;
      opts.forEach(o => o.classList.remove("disabled"));
      const wrongIndices = [];
      opts.forEach((o, idx) => { if (idx !== correctIdx) wrongIndices.push(idx); });
      const toHide = shuffle(wrongIndices).slice(0, 2);
      toHide.forEach(idx => opts[idx].classList.add("hidden"));
      const hintBtn = container.querySelector("#buyHintBtn");
      if (hintBtn) { hintBtn.disabled = true; hintBtn.textContent = "🏮 Фонарь использован"; hintBtn.classList.add("used"); }
      showToast("Путаница хитрая. Давай подумаем вместе? 💡");
      container.querySelector("#fb").className = "answer-feedback correct-msg";
      container.querySelector("#fb").textContent = "Два неправильных ответа убраны. Попробуй ещё!";
      saveProgress();
      return;
    }
    opts[i].classList.add("wrong");
    opts[correctIdx].classList.add("correct");
    addHeroStatWrong();
    logError("russian", "wrong_letter", { questionId: q.text });
    if (getCharacterLevel() >= 10 && !shieldUsedThisRound) {
      shieldUsedThisRound = true;
      showToast("🛡️ Щит героя сработал!");
    } else {
      currentLives--;
    }
    playWrongSound();
    container.querySelector("#fb").className = "answer-feedback wrong-msg";
    container.querySelector("#fb").textContent = "Попробуй ещё!";
  }
  saveProgress();

  const nextIndex = currentQuestionIndex + 1;
  const quizOver = nextIndex >= currentQuestions.length || currentLives <= 0;

  setTimeout(() => {
    currentQuestionIndex = nextIndex;
    if (quizOver) {
      const ratio = currentQuestions.length ? currentCorrect / currentQuestions.length : 0;
      const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
      const extraBonuses = { fullLives: currentLives >= maxLivesThisRound, noHint: !hintUsedThisRound };
      try {
        finishLevel("russian", stars, currentCorrect * COINS_PER_CORRECT, extraBonuses);
      } catch (err) {
        showLevelResult("russian", stars, currentCorrect * COINS_PER_CORRECT, 0, extraBonuses);
      }
    } else {
      russianQuizScreen();
    }
  }, 1100);
}

// ——— Память ———
function startTimer() {
  memoryTime = 0;
  timerInterval = setInterval(() => {
    memoryTime++;
    const el = document.getElementById("timer");
    if (el) el.innerText = memoryTime;
  }, 1000);
}

const MEMORY_SYMBOLS = ["🍎","🐶","🚗","⭐","🍌","🐱","🌟","🚀","🔵","🟢","🍪","🌸"];

function memoryScreen() {
  const diff = currentDifficulty || DIFFICULTY[1];
  const pairCount = diff.memoryPairs || 4;
  const starTime3 = diff.memoryStarTime3 != null ? diff.memoryStarTime3 : 35;
  const starTime2 = diff.memoryStarTime2 != null ? diff.memoryStarTime2 : 50;
  const symbolsForPairs = MEMORY_SYMBOLS.slice(0, pairCount);
  const items = shuffle([...symbolsForPairs, ...symbolsForPairs]);

  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <div class="top-bar"><div class="currency">💰 ${state.coins}</div><button class="btn-back" id="backBtn">⬅</button></div>
    <h2 style="text-align:center;">🃏 Найди пары</h2>
    <div class="hint-box">
      <span class="hint-icon">🃏</span>
      <span>Нажимай на карточки с вопросиком. Найди две карточки с одинаковой картинкой — это пара. Открой все ${pairCount} пары!</span>
    </div>
    <p style="text-align:center;">⏱ <span id="timer">0</span> сек</p>
    <div id="grid" class="memory-grid"></div>
  `;
  div.querySelector("#backBtn").onclick = () => {
    showConfirm({
      title: "Выйти из игры?",
      text: "Ты вернёшься на карту.",
      yesLabel: "Выйти",
      noLabel: "Играть",
      icon: "⬅️",
      onYes: () => { clearInterval(timerInterval); mapScreen(); }
    });
  };
  render(div);
  startTimer();
  matchedPairs = 0;
  firstCard = null;
  memoryLocked = false;
  const grid = div.querySelector("#grid");
  items.forEach(sym => {
    const card = document.createElement("div");
    card.className = "memory-card";
    card.innerHTML = `<div class="memory-card-inner"><div class="memory-front">?</div><div class="memory-back">${sym}</div></div>`;
    card.dataset.symbol = sym;
    card.onclick = () => {
      if (memoryLocked || card.classList.contains("flipped") || firstCard === card) return;
      card.classList.add("flipped");
      if (!firstCard) firstCard = card;
      else {
        if (firstCard.dataset.symbol !== card.dataset.symbol) {
          memoryLocked = true;
          playWrongSound();
          setTimeout(() => {
            firstCard.classList.remove("flipped");
            card.classList.remove("flipped");
            firstCard = null;
            memoryLocked = false;
          }, 700);
        } else {
          matchedPairs++;
          addSubskillProgress("attention", "memory_pairs", true);
          successSound.play().catch(() => {});
          showToast("Пара! ✨");
          firstCard = null;
          if (matchedPairs === pairCount) {
            clearInterval(timerInterval);
            const stars = memoryTime <= starTime3 ? 3 : memoryTime <= starTime2 ? 2 : 1;
            finishLevel("memory", stars, 25);
          }
        }
      }
    };
    grid.appendChild(card);
  });
}

// ——— Логика (найди лишнее) ———
const LOGIC_QUESTIONS = [
  { items: ["🍎","🍎","🍌","🍎"], odd: 2 },
  { items: ["🐶","🐶","🐶","🐱"], odd: 3 },
  { items: ["🔵","🔵","🟢","🔵"], odd: 2 },
  { items: ["1","2","3","5"], odd: 3 },
  { items: ["🔶","🔶","🔷","🔶"], odd: 2 },
  { items: ["⭐","🌙","⭐","⭐"], odd: 1 },
  { items: ["🏠","🏠","🏠","🚗"], odd: 3 },
  { items: ["🔴","🟡","🔴","🔴"], odd: 1 }
];

let logicCorrect = 0;
let logicQuestionIndex = 0;
let logicQuestions = [];

function logicScreen() {
  const diff = currentDifficulty || DIFFICULTY[1];
  const qCount = Math.min(diff.logicQuestions || 3, LOGIC_QUESTIONS.length);
  logicQuestionIndex = 0;
  logicCorrect = 0;
  logicQuestions = shuffle([...LOGIC_QUESTIONS]).slice(0, qCount);
  logicRoundScreen();
}

function logicRoundScreen() {
  const total = logicQuestions.length;
  if (logicQuestionIndex >= total) {
    const stars = logicCorrect >= total ? 3 : logicCorrect >= Math.ceil(total * 0.6) ? 2 : logicCorrect >= 1 ? 1 : 0;
    finishLevel("logic", stars, logicCorrect * 8);
    return;
  }
  const q = logicQuestions[logicQuestionIndex];
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <div class="top-bar"><div class="currency">💰 ${state.coins}</div><button class="btn-back" id="backBtn">⬅</button></div>
    <div class="quiz-progress-text">Вопрос ${logicQuestionIndex + 1} из ${total}</div>
    <h2 style="text-align:center;">🧩 Найди лишнее</h2>
    ${logicQuestionIndex === 0 ? `<div class="hint-box"><span class="hint-icon">🧩</span><span>Среди картинок одна лишняя — не такая, как остальные. Нажми на неё!</span></div>` : ""}
    <p style="text-align:center;">Какой предмет не подходит к остальным?</p>
    <div class="options-grid" id="opts"></div>
  `;
  q.items.forEach((item, i) => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.style.fontSize = "2rem";
    b.textContent = item;
    b.onclick = () => {
      div.querySelectorAll(".option-btn").forEach(x => x.classList.add("disabled"));
      addSubskillProgress("logic", "logic_odd_one", i === q.odd);
      if (i === q.odd) {
        b.classList.add("correct");
        logicCorrect++;
        addHeroStatCorrect("logic");
        addCoins(8);
        successSound.play().catch(() => {});
        showToast(pickRandom(PRAISE_PHRASES));
        setTimeout(() => { logicQuestionIndex++; logicRoundScreen(); }, 1200);
      } else {
        b.classList.add("wrong");
        playWrongSound();
        addHeroStatWrong();
        logError("logic", "wrong_odd", { questionId: q.items.join(" "), subskillId: "logic_odd_one" });
        div.querySelectorAll(".option-btn")[q.odd].classList.add("correct");
        setTimeout(() => { logicQuestionIndex++; logicRoundScreen(); }, 1200);
      }
    };
    div.querySelector("#opts").appendChild(b);
  });
  div.querySelector("#backBtn").onclick = () => {
    showConfirm({
      title: "Выйти?",
      text: "Ты вернёшься на карту.",
      yesLabel: "Выйти",
      noLabel: "Играть",
      icon: "⬅️",
      onYes: () => mapScreen()
    });
  };
  render(div);
}

// ——— Внимание (что изменилось) ———
const ATTENTION_ITEMS_POOL = ["🍎","🐶","⭐","🚗","🌲"];
const ATTENTION_REPLACEMENTS = ["🍌","🐱","🌟","🚀","🌳"];

function attentionScreen() {
  const diff = currentDifficulty || DIFFICULTY[1];
  const itemCount = Math.min(diff.attentionItems || 4, ATTENTION_ITEMS_POOL.length);
  const memorizeMs = diff.attentionMemorizeMs != null ? diff.attentionMemorizeMs : 4000;
  const items = ATTENTION_ITEMS_POOL.slice(0, itemCount);
  const changed = random(0, itemCount - 1);
  const display = [...items];
  display[changed] = ATTENTION_REPLACEMENTS[changed];
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <div class="top-bar"><div class="currency">💰 ${state.coins}</div><button class="btn-back" id="backBtn">⬅</button></div>
    <h2 style="text-align:center;">👀 Внимание!</h2>
    <div class="hint-box">
      <span class="hint-icon">👀</span>
      <span>Запомни ${itemCount} картинки вверху. Через ${memorizeMs / 1000} сек появятся снова — одна изменится. Нажми на ту, что изменилась!</span>
    </div>
    <p id="memorizeArea" style="text-align:center; font-size:2.2rem; margin:20px 0;">Запомни: ${items.join("  ")}</p>
    <p style="text-align:center; font-size:0.95rem;">Сейчас покажу снова. Нажми на то, что изменилось!</p>
    <div id="showArea" style="text-align:center; font-size:2.2rem; margin:24px 0; min-height:70px;">...</div>
    <div class="options-grid" id="opts"></div>
  `;
  const opts = div.querySelector("#opts");
  display.forEach((item, i) => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.style.fontSize = "2rem";
    b.textContent = item;
    b.onclick = () => {
      opts.querySelectorAll("button").forEach(x => x.classList.add("disabled"));
      addSubskillProgress("attention", "attention_compare", i === changed);
      if (i === changed) {
        b.classList.add("correct");
        addHeroStatCorrect("attention");
        addCoins(15);
        successSound.play().catch(() => {});
        showToast(pickRandom(PRAISE_PHRASES));
        setTimeout(() => finishLevel("attention", 2, 15), 1200);
      } else {
        b.classList.add("wrong");
        playWrongSound();
        addHeroStatWrong();
        logError("attention", "wrong_item", { questionId: items.join(" "), subskillId: "attention_compare" });
        const btns = opts.querySelectorAll("button");
        if (btns[changed]) btns[changed].classList.add("correct");
        setTimeout(() => finishLevel("attention", 1, 5), 1200);
      }
    };
    opts.appendChild(b);
  });
  div.querySelector("#backBtn").onclick = () => {
    showConfirm({
      title: "Выйти?",
      text: "Ты вернёшься на карту.",
      yesLabel: "Выйти",
      noLabel: "Играть",
      icon: "⬅️",
      onYes: () => mapScreen()
    });
  };
  render(div);
  setTimeout(() => {
    const memorizeEl = div.querySelector("#memorizeArea");
    if (memorizeEl) memorizeEl.style.display = "none";
    div.querySelector("#showArea").textContent = display.join("  ");
  }, memorizeMs);
}

// ——— Реакция ———
function reactionScreen() {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <div class="top-bar"><div class="currency">💰 ${state.coins}</div><button class="btn-back" id="backBtn">⬅</button></div>
    <h2 style="text-align:center;">⚡ Реакция</h2>
    <div class="hint-box">
      <span class="hint-icon">⚡</span>
      <span>Сначала будет надпись «Жди...». Когда появится цель 🎯 — нажми на неё как можно быстрее!</span>
    </div>
    <p style="text-align:center;">Когда появится цель — жми на неё как можно быстрее!</p>
    <div class="reaction-zone" id="zone">
      <p id="waitMsg">Жди...</p>
    </div>
    <p id="result" style="text-align:center; font-weight:800;"></p>
  `;
  div.querySelector("#backBtn").onclick = () => {
    showConfirm({
      title: "Выйти?",
      text: "Ты вернёшься на карту.",
      yesLabel: "Выйти",
      noLabel: "Играть",
      icon: "⬅️",
      onYes: () => {
        if (reactionTimeout) clearTimeout(reactionTimeout);
        mapScreen();
      }
    });
  };
  render(div);
  const diff = currentDifficulty || DIFFICULTY[1];
  const delayMin = diff.reactionDelayMin != null ? diff.reactionDelayMin : 1500;
  const delayMax = diff.reactionDelayMax != null ? diff.reactionDelayMax : 3500;
  const star3Ms = diff.reactionStar3Ms != null ? diff.reactionStar3Ms : 600;
  const star2Ms = diff.reactionStar2Ms != null ? diff.reactionStar2Ms : 1000;
  const delay = delayMin + random(0, Math.max(0, delayMax - delayMin));
  const zone = div.querySelector("#zone");
  reactionTimeout = setTimeout(() => {
    reactionStartTime = Date.now();
    zone.innerHTML = '<div class="reaction-target" id="target">🎯</div>';
    zone.querySelector("#target").onclick = () => {
      const ms = Date.now() - reactionStartTime;
      const stars = ms <= star3Ms ? 3 : ms <= star2Ms ? 2 : 1;
      addCoins(stars === 3 ? 20 : stars === 2 ? 15 : 10);
      successSound.play().catch(() => {});
      div.querySelector("#result").textContent = `${ms} мс! ${stars === 3 ? "Молния! ⚡" : stars === 2 ? "Быстро! 👍" : "Хорошо! 👌"}`;
      zone.innerHTML = "";
      addStars("reaction", stars);
      setTimeout(() => finishLevel("reaction", stars, stars === 3 ? 20 : stars === 2 ? 15 : 10), 1500);
    };
  }, delay);
}

// ——— Достижения ———
// ——— Лавка Знаний (магазин 2.0) ———
function shopScreen() {
  const div = document.createElement("div");
  div.className = "card shop-card";
  if (state.selectedExtras && state.selectedExtras.includes("goldFrame")) div.classList.add("gold-frame");

  let category = "tools";
  function renderShop() {
    const coinsEl = div.querySelector("#shopCoins");
    if (coinsEl) coinsEl.textContent = state.coins;

    const list = div.querySelector("#shopList");
    const categoryHint = div.querySelector("#shopCategoryHint");
    if (!list) return;
    list.innerHTML = "";

    if (categoryHint) {
      if (category === "heroSkin") {
        categoryHint.style.display = "block";
        categoryHint.innerHTML = "<span class=\"hint-icon\">🦸</span> Скины меняют только образ героя на карте и в профиле — для красоты и настроения. На силу героя и задания не влияют.";
        categoryHint.className = "shop-category-hint";
      } else {
        categoryHint.style.display = "none";
      }
    }

    let items = SHOP_ITEMS.filter(i => i.type === category);
    if (category === "heroSkin") items = items.filter(i => i.heroId === (state.character && state.character.id));
    items.forEach(it => {
      const isTool = it.type === "tools";
      const isSkill = it.type === "skillBoost";
      const isIsland = it.type === "island";
      const isCosmetic = ["avatar", "background", "heroSkin", "extra"].includes(it.type);
      const purchased = isCosmetic && (it.price === 0 || state.purchasedItems.includes(it.id));
      const isIslandPurchased = isIsland && state.purchasedItems.includes(it.id);
      const toolAlreadyBought = isTool && (state.activeBoosters || []).some(b => b.value === it.value && b.expiresAt === "round");
      const activeSkill = isSkill && (state.activeBoosters || []).find(b => b.skillId === it.skillId && b.tasksLeft > 0);
      const isSelected =
        (it.type === "avatar" && state.avatar === it.value) ||
        (it.type === "background" && state.selectedBackground === it.value) ||
        (it.type === "heroSkin" && state.characterSkin === it.value) ||
        (it.type === "extra" && state.selectedExtras && state.selectedExtras.includes(it.value));

      const itemEl = document.createElement("div");
      itemEl.className = "shop-item" + (isSelected ? " selected" : "");
      const priceLine = toolAlreadyBought ? "Куплено на этот раунд" : activeSkill ? `Осталось заданий: ${activeSkill.tasksLeft}` : (!purchased && !isIslandPurchased) ? it.price + " 💰" : "";
      const btnText = isTool ? (toolAlreadyBought ? "Куплено на раунд ✓" : "Купить на раунд") : isSkill && activeSkill ? "Активно" : isIsland && isIslandPurchased ? "Куплено ✓" : isCosmetic && purchased ? (isSelected ? "Выбрано ✓" : "Выбрать") : "Купить";
      const btnDisabled = isSkill && activeSkill ? "disabled" : isTool && toolAlreadyBought ? "disabled" : "";
      itemEl.innerHTML = `
        <div class="shop-item-icon">${it.icon}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${it.name}</div>
          ${it.desc ? `<div class="shop-item-desc">${it.desc}</div>` : ""}
          <div class="shop-item-price">${priceLine}</div>
        </div>
        <button type="button" class="shop-item-btn ${(isCosmetic && purchased) || isIslandPurchased ? "btn-primary" : "btn-secondary"}" data-id="${it.id}" ${btnDisabled}>
          ${btnText}
        </button>
      `;

      const btn = itemEl.querySelector(".shop-item-btn");
      btn.onclick = () => {
        if (isTool) {
          const alreadyBought = (state.activeBoosters || []).some(b => b.value === it.value && b.expiresAt === "round");
          if (alreadyBought) { showToast("Уже куплено на этот раунд. Зайди в квиз — бустер сработает!"); return; }
          if (state.coins < it.price) { showToast("Не хватает монет! Зарабатывай, решая задания 💰"); return; }
          state.coins -= it.price;
          state.activeBoosters = state.activeBoosters || [];
          state.activeBoosters.push({ value: it.value, expiresAt: "round" });
          successSound.play().catch(() => {});
          showToast("Готово! " + it.icon + " Будет действовать в следующем раунде.");
          saveProgress();
          renderShop();
          return;
        }
        if (isSkill && !activeSkill) {
          if (state.coins < it.price) { showToast("Не хватает монет! 💰"); return; }
          state.coins -= it.price;
          state.activeBoosters = state.activeBoosters || [];
          state.activeBoosters.push({
            value: it.value,
            skillId: it.skillId,
            tasksLeft: it.tasksCount || 5,
            xpMul: it.xpMul || 1.5
          });
          successSound.play().catch(() => {});
          showToast("Сила навыка активирована! " + it.icon);
          saveProgress();
          renderShop();
          return;
        }
        if (isIsland && !isIslandPurchased) {
          if (state.coins < it.price) { showToast("Не хватает монет! 💰"); return; }
          state.coins -= it.price;
          state.purchasedItems = state.purchasedItems || [];
          state.purchasedItems.push(it.id);
          successSound.play().catch(() => {});
          showToast("Куплено! Остров светлее. " + it.icon);
          saveProgress();
          renderShop();
          return;
        }
        if (isCosmetic && !purchased) {
          if (state.coins < it.price) { showToast("Не хватает монет! 💰"); return; }
          state.coins -= it.price;
          state.purchasedItems = state.purchasedItems || [];
          state.purchasedItems.push(it.id);
          successSound.play().catch(() => {});
          showToast("Куплено! " + it.name + " " + it.icon);
          saveProgress();
          renderShop();
          return;
        }
        if (!isCosmetic || !purchased) return;
        playTapSound();
        if (it.type === "avatar") {
          state.avatar = it.value;
          showToast("Теперь твой аватар: " + it.icon);
        } else if (it.type === "background") {
          state.selectedBackground = it.value;
          applyBackground();
          showToast("Фон изменён: " + it.name);
        } else if (it.type === "heroSkin") {
          state.characterSkin = it.value;
          showToast("Скин героя: " + it.name + " " + it.icon);
        } else if (it.type === "extra") {
          if (!state.selectedExtras) state.selectedExtras = [];
          const idx = state.selectedExtras.indexOf(it.value);
          if (idx >= 0) state.selectedExtras.splice(idx, 1);
          else state.selectedExtras.push(it.value);
          showToast(isSelected ? "Отключено" : "Включено: " + it.name);
        }
        saveProgress();
        renderShop();
      };

      list.appendChild(itemEl);
    });
  }

  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅ На карту</button>
    <h2 style="text-align:center;">📚 Лавка Знаний</h2>
    <p style="text-align:center; color:var(--text-muted); font-size:0.9rem;">Помогаем думать — не думаем за тебя</p>
    <div class="hint-box">
      <span class="hint-icon">💡</span>
      <span>Монеты зарабатывай правильными ответами. Здесь — инструменты для учёбы, сила для героя и украшения Острова. Никаких готовых ответов!</span>
    </div>
    <div class="shop-coins">У тебя: <strong id="shopCoins">${state.coins}</strong> 💰</div>
    <div class="shop-tabs" id="shopTabs"></div>
    <div id="shopCategoryHint" class="shop-category-hint" style="display:none;"></div>
    <div class="shop-list" id="shopList"></div>
  `;

  SHOP_CATEGORIES.forEach(cat => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "shop-tab" + (cat.id === category ? " active" : "");
    tab.textContent = cat.icon + " " + cat.name;
    tab.onclick = () => {
      category = cat.id;
      div.querySelectorAll(".shop-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderShop();
    };
    div.querySelector("#shopTabs").appendChild(tab);
  });

  div.querySelector("#backBtn").onclick = mapScreen;
  render(div);
  renderShop();
}

// ——— Поляна Мудрости (Учусь учиться) ———
function metaskillScreen(lessonIndex = -1) {
  const div = document.createElement("div");
  div.className = "card";
  if (lessonIndex < 0) {
    div.innerHTML = `
      <button class="btn-back" id="backBtn">⬅ На карту</button>
      <h2>🧠 Поляна Мудрости</h2>
      <p style="text-align:center; color:var(--text-muted);">Путаница боится, когда ты знаешь <em>как</em> думать. Научи героя — и Остров станет ярче!</p>
      <div class="meta-lessons-list" id="lessons"></div>
    `;
    META_LESSONS.forEach((lesson, i) => {
      const completed = (state.completedMetaLessons || []).includes(lesson.id);
      const item = document.createElement("div");
      item.className = "meta-lesson-item" + (completed ? " completed" : "");
      item.innerHTML = `
        <span class="meta-lesson-icon">${lesson.icon}</span>
        <div class="meta-lesson-info">
          <div class="meta-lesson-title">${lesson.title}</div>
          <div class="meta-lesson-desc">${lesson.theory.substring(0, 45)}…</div>
        </div>
        <span class="meta-lesson-arrow">${completed ? "✓" : "→"}</span>
      `;
      item.onclick = () => metaskillScreen(i);
      div.querySelector("#lessons").appendChild(item);
    });
    div.querySelector("#backBtn").onclick = mapScreen;
  } else {
    const lesson = META_LESSONS[lessonIndex];
    div.innerHTML = `
      <button class="btn-back" id="backBtn">⬅ К списку</button>
      <h2>${lesson.icon} ${lesson.title}</h2>
      <div class="meta-theory-box">
        <p><strong>Теория:</strong> ${lesson.theory}</p>
        <p><strong>Пример:</strong> ${lesson.example}</p>
      </div>
      <div class="meta-interactive">
        <p class="meta-question">${lesson.interactive.question}</p>
        <div class="meta-options" id="opts"></div>
      </div>
      <div id="resultBox" style="display:none;"></div>
    `;
    lesson.interactive.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "btn-secondary meta-opt";
      b.textContent = opt;
      b.onclick = () => {
        div.querySelectorAll(".meta-opt").forEach(x => x.classList.add("disabled"));
        if (i === lesson.interactive.correct) {
          b.classList.add("correct");
          state.heroStats = state.heroStats || {};
          state.heroStats[lesson.statKey] = (state.heroStats[lesson.statKey] || 0) + 2;
          state.completedMetaLessons = state.completedMetaLessons || [];
          if (!state.completedMetaLessons.includes(lesson.id)) state.completedMetaLessons.push(lesson.id);
          addSubskillProgress("metaskill", "meta_" + lesson.id, true);
          addCoins(COINS_PER_CORRECT);
          successSound.play().catch(() => {});
          checkStoryQuests();
          saveProgress();
          div.querySelector("#resultBox").style.display = "block";
          div.querySelector("#resultBox").innerHTML = `<p class="result-ok">${pickRandom(PRAISE_PHRASES)}</p><p>+${COINS_PER_CORRECT} 💰</p><p style="font-size:0.9rem; color:var(--text-muted);">Теперь попробуй применить это в Задачах или Чтении!</p><button class="btn-secondary" id="nextBtn">К списку уроков</button>`;
          div.querySelector("#nextBtn").onclick = () => metaskillScreen(-1);
        } else {
          b.classList.add("wrong");
          playWrongSound();
          div.querySelector("#resultBox").style.display = "block";
          div.querySelector("#resultBox").innerHTML = `<p class="result-err">Попробуй ещё раз! Подсказка: ${lesson.example}</p><button class="btn-secondary" id="retryBtn">Попробовать снова</button>`;
          div.querySelector("#retryBtn").onclick = () => metaskillScreen(lessonIndex);
        }
      };
      div.querySelector("#opts").appendChild(b);
    });
    div.querySelector("#backBtn").onclick = () => metaskillScreen(-1);
  }
  render(div);
}

// ——— Берег историй (Чтение с пониманием) ———
let currentReading = null;
let currentReadingQ = 0;
let currentReadingCorrect = 0;

function readingScreen(textIndex = -1) {
  if (textIndex < 0) {
    const completed = state.readingTextsCompleted || [];
    const available = READING_TEXTS.filter(rt => !completed.includes(rt.id));
    currentReading = pickRandom(available.length ? available : READING_TEXTS);
    currentReadingQ = 0;
    currentReadingCorrect = 0;
  }
  const t = currentReading;
  if (!t || currentReadingQ >= t.questions.length) {
    const ratio = t ? currentReadingCorrect / t.questions.length : 0;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
    const coins = Math.floor(currentReadingCorrect * COINS_PER_CORRECT * (stars >= 2 ? 1.2 : 1));
    addCoins(coins);
    if (!state.levelStars) state.levelStars = {};
    state.levelStars.reading = Math.max(state.levelStars.reading || 0, stars);
    addStars("reading", stars);
    state.heroStats = state.heroStats || {};
    const textId = t.id;
    if (textId && !(state.readingTextsCompleted || []).includes(textId)) {
      state.readingTextsCompleted = state.readingTextsCompleted || [];
      state.readingTextsCompleted.push(textId);
    }
    saveProgress();
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <button class="btn-back" id="backBtn">⬅ На карту</button>
      <h2>📚 Берег историй</h2>
      <p class="result-ok">${ratio >= 0.9 ? "Отлично! Ты понял текст!" : ratio >= 0.6 ? "Хорошо справился!" : "Продолжай тренироваться!"}</p>
      <p>Правильно: ${currentReadingCorrect} из ${t.questions.length}</p>
      <p>+${coins} 💰 | ⭐ ${stars} звёзд</p>
      <button class="btn-primary" id="againBtn">Ещё текст</button>
      <button class="btn-secondary" id="mapBtn">На карту</button>
    `;
    div.querySelector("#backBtn").onclick = mapScreen;
    div.querySelector("#againBtn").onclick = () => readingScreen(-1);
    div.querySelector("#mapBtn").onclick = mapScreen;
    render(div);
    return;
  }
  const q = t.questions[currentReadingQ];
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅</button>
    <h2>📚 Берег историй</h2>
    <div class="reading-text-box">
      <p>${t.text}</p>
    </div>
    <p class="reading-question">Вопрос ${currentReadingQ + 1} из ${t.questions.length}: ${q.q}</p>
    <div class="options-grid" id="opts"></div>
    <div id="fb"></div>
  `;
  q.opts.forEach((opt, i) => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.textContent = opt;
    b.onclick = () => {
      div.querySelectorAll(".option-btn").forEach(o => o.classList.add("disabled"));
      const subId = "reading_" + (q.type || "fact");
      addSubskillProgress("reading", subId, i === q.correct);
      if (i === q.correct) {
        b.classList.add("correct");
        currentReadingCorrect++;
        addCoins(COINS_PER_CORRECT);
        const rMul = getSkillBoostMul("reading");
        state.heroStats.mind = (state.heroStats.mind || 0) + Math.round(2 * rMul);
        if (rMul > 1) consumeSkillBoost("reading");
        successSound.play().catch(() => {});
        div.querySelector("#fb").className = "answer-feedback correct-msg";
        div.querySelector("#fb").textContent = pickRandom(PRAISE_PHRASES);
        setTimeout(() => { currentReadingQ++; readingScreen(0); }, 800);
      } else {
        b.classList.add("wrong");
        playWrongSound();
        logError("reading", q.type || "comprehension", { questionId: q.q, subskillId: "reading_" + (q.type || "fact") });
        div.querySelector(`.option-btn:nth-child(${q.correct + 1})`).classList.add("correct");
        div.querySelector("#fb").className = "answer-feedback wrong-msg";
        div.querySelector("#fb").textContent = "Перечитай текст и попробуй ещё раз.";
        setTimeout(() => { currentReadingQ++; readingScreen(0); }, 1200);
      }
    };
    div.querySelector("#opts").appendChild(b);
  });
  div.querySelector("#backBtn").onclick = () => {
    showConfirm({ title: "Выйти?", text: "Прогресс не сохранится.", icon: "⬅️", onYes: () => mapScreen() });
  };
  render(div);
}

// ——— Мост задач (Текстовые задачи) ———
function wordProblemsScreen(forceOpen) {
  if (!forceOpen && !isModuleUnlocked("wordproblems")) {
    const meta = (state.completedMetaLessons || []).length;
    const reading = (state.readingTextsCompleted || []).length;
    showConfirm({
      title: "Мост задач",
      text: "Сначала пройди 1 урок в Поляне Мудрости (🧠 Учусь) и 1 текст на Берегу историй (📚 Чтение) — они помогут разбирать задачи!",
      yesLabel: "К Поляне Мудрости",
      noLabel: "Всё равно попробовать",
      icon: "📝",
      onYes: () => metaskillScreen(),
      onNo: () => wordProblemsScreen(true)
    });
    return;
  }
  const wp = pickRandom(WORD_PROBLEMS);
  let taskHtml = wp.task;
  (wp.keyWords || []).forEach(kw => {
    taskHtml = taskHtml.replace(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), `<strong class="key-word">${kw}</strong>`);
  });
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅</button>
    <h2>📝 Мост задач</h2>
    <p style="color:var(--text-muted); font-size:0.9rem;">Разберём задачу по шагам</p>
    ${(state.completedMetaLessons || []).includes("find_main") ? `<div class="hint-box" style="margin-bottom:12px;"><span class="hint-icon">🔍</span><span>Вспомни: как находить главное в задаче!</span></div>` : ""}
    <div class="word-task-box">
      <p class="word-task-text">${taskHtml}</p>
    </div>
    <div class="word-steps">
      ${wp.who && wp.who !== "—" ? `<div class="word-step"><strong>Кто?</strong> ${wp.who}</div>` : ""}
      <div class="word-step"><strong>Что известно?</strong> ${wp.known}</div>
      <div class="word-step"><strong>Что нужно найти?</strong> ${wp.find}</div>
    </div>
    <div class="word-scheme">${wp.scheme}</div>
    <p class="word-question">Сколько получится? Выбери ответ:</p>
    <div class="options-grid" id="opts"></div>
    <div id="fb"></div>
  `;
  const wrongOpts = [wp.answer - 2, wp.answer - 1, wp.answer + 1, wp.answer + 2, wp.answer + 3].filter(x => x >= 0 && x !== wp.answer && x <= 20);
  const opts = shuffle([wp.answer, ...shuffle(wrongOpts).slice(0, 3)]);
  opts.forEach(ans => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.textContent = ans;
    b.onclick = () => {
      div.querySelectorAll(".option-btn").forEach(o => o.classList.add("disabled"));
      addSubskillProgress("wordproblems", wp.subskillId || "wp_keyword_total", ans === wp.answer);
      if (ans === wp.answer) {
        b.classList.add("correct");
        addCoins(Math.floor(COINS_PER_CORRECT * 1.2));
        state.heroStats = state.heroStats || {};
        const wpMul = getSkillBoostMul("wordproblems");
        state.heroStats.mind = (state.heroStats.mind || 0) + Math.round(2 * wpMul);
        if (wpMul > 1) consumeSkillBoost("wordproblems");
        if (!state.levelStars) state.levelStars = {};
        state.levelStars.wordproblems = Math.max(state.levelStars.wordproblems || 0, 2);
        successSound.play().catch(() => {});
        div.querySelector("#fb").className = "answer-feedback correct-msg";
        div.querySelector("#fb").textContent = pickRandom(PRAISE_PHRASES) + " Ты правильно разобрал задачу!";
        saveProgress();
        setTimeout(() => {
          const d2 = document.createElement("div");
          d2.className = "card";
          d2.innerHTML = `
            <button class="btn-back" id="b2">⬅</button>
            <h2>📝 Мост задач</h2>
            <p class="result-ok">Молодец! Задача решена!</p>
            <button class="btn-primary" id="again">Ещё задача</button>
            <button class="btn-secondary" id="map">На карту</button>
          `;
          d2.querySelector("#b2").onclick = mapScreen;
          d2.querySelector("#again").onclick = () => wordProblemsScreen(true);
          d2.querySelector("#map").onclick = mapScreen;
          render(d2);
        }, 1200);
      } else {
        b.classList.add("wrong");
        playWrongSound();
        logError("wordproblems", "wrong_answer", { questionId: wp.task, subskillId: wp.subskillId || "wp_keyword_total" });
        [...div.querySelectorAll(".option-btn")].forEach(btn => {
          if (parseInt(btn.textContent) === wp.answer) btn.classList.add("correct");
        });
        div.querySelector("#fb").className = "answer-feedback wrong-msg";
        div.querySelector("#fb").textContent = `Подумай ещё. Слово «${wp.keyWords[0] || "всего"}» подсказывает: складывать или вычитать?`;
        setTimeout(() => wordProblemsScreen(true), 2000);
      }
    };
    div.querySelector("#opts").appendChild(b);
  });
  div.querySelector("#backBtn").onclick = () => {
    showConfirm({ title: "Выйти?", text: "Прогресс не сохранится.", icon: "⬅️", onYes: () => mapScreen() });
  };
  render(div);
}

// ——— Книга знаний (Карта навыков) ———
function knowledgeMapScreen() {
  const div = document.createElement("div");
  div.className = "card";
  const ls = state.levelStars || {};
  const sp = state.subskillProgress || {};
  const skillRows = KNOWLEDGE_SKILLS.map(s => {
    let stars = 0;
    s.levelIds.forEach((lid) => { stars = Math.max(stars, ls[lid] || 0); });
    if (s.id === "metaskill") {
      const completed = (state.completedMetaLessons || []).length;
      stars = completed >= 4 ? 3 : completed >= 2 ? 2 : completed >= 1 ? 1 : 0;
    }
    const starStr = "⭐".repeat(stars) + "☆".repeat(3 - stars);
    const isStrong = stars >= 2;
    const isWeak = stars < 1 && (s.levelIds.some(lid => ls[lid] !== undefined) || s.id === "metaskill");
    const subskills = SUBSKILLS_DEFAULT[s.id] ? Object.keys(SUBSKILLS_DEFAULT[s.id]) : [];
    const subRows = subskills.map(subId => {
      const lvl = getSubskillLevel(s.id, subId);
      const name = SUBSKILL_NAMES[subId] || subId;
      const disp = s.id === "metaskill" ? (lvl ? "✓" : "—") : "⭐".repeat(lvl) + "☆".repeat(3 - lvl);
      const stageKey = getSubskillStage(s.id, subId);
      const stageLabel = stageKey !== "none" ? STAGE_CONFIG[stageKey].icon + " " + STAGE_CONFIG[stageKey].name : "";
      const needsReinforce = getSubskillNeedsReinforcement(s.id, subId);
      const reinforceHint = needsReinforce ? '<span class="subskill-reinforce">🔄 Потренируй ещё</span>' : "";
      return `<div class="knowledge-subskill"><span class="subskill-name">${name}</span><span class="subskill-stars">${disp}</span>${stageLabel ? `<span class="subskill-stage">${stageLabel}</span>` : ""}${reinforceHint}</div>`;
    }).join("");
    return `<div class="knowledge-skill ${isStrong ? "strong" : ""} ${isWeak ? "weak" : ""}"><div class="knowledge-skill-row"><span class="skill-icon">${s.icon}</span><span class="skill-name">${s.name}</span><span class="skill-stars">${starStr}</span></div>${subRows ? `<div class="knowledge-subskills">${subRows}</div>` : ""}</div>`;
  }).join("");
  const strongest = getStrongestStat();
  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅ На карту</button>
    <h2>🗺 Книга знаний</h2>
    <p style="text-align:center; color:var(--text-muted);">Твои прокачанные навыки и поднавыки</p>
    ${strongest ? `<p style="text-align:center; font-size:0.95rem;">Твой герой силён в: <strong>${strongest.name}</strong> ${strongest.icon}</p>` : ""}
    <div class="knowledge-map">${skillRows}</div>
    <button class="btn-secondary" id="growthPanelBtn" style="width:100%; margin-top:12px;">📈 Рост навыков</button>
    <p style="text-align:center; font-size:0.85rem; color:var(--text-muted); margin-top:16px;">🌱 Освоил → 🌿 Закрепил → 🌟 Применил. Ошибки не отнимают стадию — просто потренируй ещё!</p>
    <p style="text-align:center; font-size:0.9rem; margin-top:8px;">Выполняй задания — поднавыки покажут, что ты уже умеешь!</p>
  `;
  div.querySelector("#backBtn").onclick = mapScreen;
  div.querySelector("#growthPanelBtn").onclick = growthPanelScreen;
  render(div);
}

function growthPanelScreen() {
  const div = document.createElement("div");
  div.className = "card";
  let hasImproved = false;
  const rows = KNOWLEDGE_SKILLS.map(s => {
    const subskills = SUBSKILLS_DEFAULT[s.id] ? Object.keys(SUBSKILLS_DEFAULT[s.id]) : [];
    const subRows = subskills.map(subId => {
      if (s.id === "metaskill") {
        const done = getSubskillLevel(s.id, subId) ? 1 : 0;
        const name = SUBSKILL_NAMES[subId] || subId;
        return `<div class="growth-subskill"><span class="growth-name">${name}</span><span class="growth-meta">${done ? "✓ Пройдено" : "—"}</span></div>`;
      }
      const rate = getSubskillSuccessRate(s.id, subId);
      const baseline = getSubskillBaselineRate(s.id, subId);
      const stability = getSubskillStability(s.id, subId);
      const trend = getSubskillErrorTrend(subId);
      const growth = getSubskillGrowth(s.id, subId);
      if (growth.improved === true) hasImproved = true;
      const name = SUBSKILL_NAMES[subId] || subId;
      const total = (state.subskillProgress?.[s.id]?.[subId]?.total) || 0;
      if (total === 0) return `<div class="growth-subskill"><span class="growth-name">${name}</span><span class="growth-meta">Пока нет попыток</span></div>`;
      const progressBar = `<div class="growth-bar-wrap"><div class="growth-bar-fill" style="width:${rate}%"></div></div><span class="growth-pct">${rate}%</span>`;
      let wasBecame = "";
      if (baseline != null) {
        const arrow = growth.improved ? "↑" : (growth.became === growth.was ? "→" : "↓");
        wasBecame = `<span class="growth-was-became">Было ${baseline}% → Стало ${rate}% ${arrow}</span>`;
      }
      const stabilityDots = stability != null
        ? `<span class="growth-stability" title="Последние попытки">${(state.subskillProgress?.[s.id]?.[subId]?.lastAttempts || []).map(x => x ? "🟢" : "⚪").join("")}</span>`
        : "";
      const fewerBadge = trend.fewer && trend.prev7 > 0 ? '<span class="growth-fewer">Ошибок меньше! ↓</span>' : "";
      const phrase = growth.improved ? "Ты рос! 🌟" : (baseline != null && growth.became < growth.was ? "Потренируй ещё" : "Продолжай!");
      return `<div class="growth-subskill"><div class="growth-row"><span class="growth-name">${name}</span><span class="growth-phrase">${phrase}</span></div><div class="growth-bar-row">${progressBar}</div>${wasBecame ? `<div class="growth-dynamic">${wasBecame}</div>` : ""}<div class="growth-meta-row">${stabilityDots}${fewerBadge ? " " + fewerBadge : ""}</div></div>`;
    }).join("");
    if (subRows === "") return "";
    return `<div class="growth-skill-block"><div class="growth-skill-title">${s.icon} ${s.name}</div><div class="growth-subskills">${subRows}</div></div>`;
  }).filter(Boolean).join("");
  if (hasImproved) showToast("Герой видит твой рост! 🌟");
  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅ Назад</button>
    <h2>📈 Рост навыков</h2>
    <p style="text-align:center; color:var(--text-muted); font-size:0.9rem;">Здесь видно, как ты становишься сильнее</p>
    <div class="growth-panel">${rows}</div>
    <p style="text-align:center; font-size:0.85rem; color:var(--text-muted); margin-top:12px;">↑ лучше · → без изменений · 🟢 верно, ⚪ ошибка</p>
  `;
  div.querySelector("#backBtn").onclick = knowledgeMapScreen;
  render(div);
}

function legendScreen() {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅ Назад</button>
    <h2>📖 Легенда Острова Знаний</h2>
    <div class="legend-text">
      <p>Давным-давно на волшебном <strong>Острове Знаний</strong> жили мудрые существа, и светилась <strong>Книга Мудрости</strong>.</p>
      <p>Но однажды появилась <strong>Путаница</strong> — тень, которая питается незнанием. Она разбросала буквы, перепутала цифры и усыпила Остров.</p>
      <p>Остался только один маленький герой — он не поддался Путанице, потому что хотел учиться. <strong>Ты</strong> помогаешь ему!</p>
      <p>Твоя миссия: путешествовать по областям Острова и собирать <strong>Светлячков</strong>. Светлячок — это не просто ответ, а <em>понимание</em>. Когда ты находишь главное в задаче — зажигается Светлячок. Когда проверяешь ответ — ещё один. Чем больше понимаешь — тем ярче свет!</p>
      <p>Путаница не страшная — она просто «тень незнания». Когда ты учишься, ты рассеиваешь её. <em>Ты и твой герой растёте вместе!</em></p>
    </div>
    <button class="btn-secondary" id="legendBackBtn" style="width:100%; margin-top:20px;">${state.name ? "На карту" : "Назад"}</button>
  `;
  const goBack = state.name ? mapScreen : () => render(welcomeScreen());
  div.querySelector("#backBtn").onclick = goBack;
  div.querySelector("#legendBackBtn").onclick = goBack;
  render(div);
}

function questsScreen() {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅ Назад</button>
    <h2>📜 Сюжетные квесты</h2>
    <p style="text-align:center; color:var(--text-muted); font-size:0.95rem;">Спасай Остров Знаний — выполняй квесты по порядку!</p>
    <div class="quests-list" id="questsList"></div>
  `;
  const completed = state.completedQuests || [];
  STORY_QUESTS.forEach((q, i) => {
    const done = completed.includes(q.id);
    const locked = i > 0 && !completed.includes(STORY_QUESTS[i - 1].id);
    const item = document.createElement("div");
    item.className = "quest-item" + (done ? " completed" : "") + (locked ? " locked" : "");
    item.innerHTML = `
      <span class="quest-icon">${done ? "✓" : q.icon}</span>
      <div class="quest-info">
        <div class="quest-title">${q.title}</div>
        <div class="quest-text">${locked ? "Сначала выполни предыдущий квест" : q.text}</div>
        ${done ? `<span class="quest-reward">+${q.reward} 💰</span>` : !locked ? `<span class="quest-reward">Награда: ${q.reward} 💰</span>` : ""}
      </div>
    `;
    div.querySelector("#questsList").appendChild(item);
  });
  div.querySelector("#backBtn").onclick = mapScreen;
  render(div);
}

function achievementsScreen() {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <button class="btn-back" id="backBtn">⬅ Назад</button>
    <h2>🏅 Достижения</h2>
    <div class="achievements-grid" id="achGrid"></div>
  `;
  ACHIEVEMENTS.forEach(a => {
    const un = state.achievements.includes(a.id);
    const item = document.createElement("div");
    item.className = "achievement-item" + (un ? " unlocked" : "");
    item.innerHTML = `<span class="ach-icon">${a.icon}</span><span class="ach-name">${a.name}</span>`;
    div.querySelector("#achGrid").appendChild(item);
  });
  div.querySelector("#backBtn").onclick = mapScreen;
  render(div);
}

// ——— Запуск ———
loadProgress();
if (state.name && state.character && state.character.id) {
  state.avatar = state.character.icon;
  mapScreen();
} else if (state.name) {
  chooseHeroScreen();
} else {
  render(welcomeScreen());
}
