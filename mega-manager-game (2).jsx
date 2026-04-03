import { useState, useEffect, useCallback, useRef } from "react";

// ============ GAME DATA ============
const CHARACTERS = [
  {
    id: "alex",
    name: "Алекс",
    gender: "м",
    trait: "Аналитик",
    desc: "Спокойный и методичный. Любит всё разложить по полочкам прежде чем действовать. ИИ-очки дополненной реальности помогают видеть данные в реальном времени.",
    emoji: "🧑‍💻",
    color: "#4A90D9",
  },
  {
    id: "mila",
    name: "Мила",
    gender: "ж",
    trait: "Коммуникатор",
    desc: "Общительная и энергичная. Легко находит общий язык с любой командой. Нейро-браслет помогает считывать настроение коллег.",
    emoji: "👩‍💼",
    color: "#E07CC5",
  },
  {
    id: "dani",
    name: "Дани",
    gender: "м",
    trait: "Стратег",
    desc: "Тихий, но решительный. Видит картину целиком и планирует на три шага вперёд. ИИ-планшет составляет прогнозы за секунды.",
    emoji: "🧑‍🔬",
    color: "#56B870",
  },
  {
    id: "kira",
    name: "Кира",
    gender: "ж",
    trait: "Креативщик",
    desc: "Скромная, но с яркими идеями. Находит нестандартные решения, когда все заходят в тупик. Голо-блокнот визуализирует любую мысль.",
    emoji: "👩‍🎨",
    color: "#F0A030",
  },
  {
    id: "rio",
    name: "Рио",
    gender: "м",
    trait: "Лидер",
    desc: "Уверенный и целеустремлённый. Берёт ответственность и ведёт за собой. ИИ-наушник подсказывает оптимальные решения в реальном времени.",
    emoji: "🧑‍✈️",
    color: "#D95050",
  },
];

const EMPLOYEES = {
  researcher: { name: "Исследователь", emoji: "🔍", rooms: [1], quality: 1, speed: 1 },
  pedagogue: { name: "Педагог-проектировщик", emoji: "📐", rooms: [1], quality: 1, speed: 1 },
  programmer: { name: "Программист", emoji: "💻", rooms: [1, 2], quality: 1, speed: 1, helperQuality: 0.5, helperSpeed: 0.5 },
  scriptwriter: { name: "Сценарист", emoji: "✍️", rooms: [2], quality: 1, speed: 1 },
  curator: { name: "Куратор", emoji: "🎓", rooms: [3], quality: 1, speed: 1 },
  robot: { name: "Робот", emoji: "🤖", rooms: [1, 2, 3], quality: 1, speed: 1, universal: true },
  freelancer: { name: "Фрилансер", emoji: "🧳", rooms: [1, 2, 3], quality: 0.5, speed: 0.5, universal: true, maxRooms: 5 },
};

const WORK_ROOMS = [
  { id: 1, name: "Методология и аналитика", emoji: "📊", maxWorkers: 3 },
  { id: 2, name: "Продакшн и контент", emoji: "🎬", maxWorkers: 3 },
  { id: 3, name: "Тест-драйв и сопровождение", emoji: "🧪", maxWorkers: 3 },
];
const REST_ROOM = { id: "rest", name: "Комната отдыха", emoji: "🛋️", maxWorkers: 99, isRest: true };
const ROOMS = WORK_ROOMS; // alias used in scoring logic

// turnUnit: what one "turn" is called for this mission
const MISSIONS = [
  {
    id: 1,
    title: 'Короткий онлайн-курс "Обучение Python"',
    desc: "Низкая сложность, быстрый цикл. Акцент на скорости.",
    metric: "speed",
    threshold: 5,
    maxTurns: 3,
    turnUnit: "недели",
    reward: { money: 100, social: 1, items: ["robot"] },
    shopAfter: [{ id: "rest_zone", name: "Зона отдыха", price: 80, desc: "Сотрудники смогут восстанавливаться" }],
    specialRules: {},
    correctHint: "Распредели сотрудников по специальностям. Программист универсален!",
    roomScoring: {
      1: { needed: ["researcher", "pedagogue"], bonus: ["programmer"], metric: "speed" },
      2: { needed: ["programmer", "scriptwriter"], bonus: [], metric: "speed" },
      3: { needed: ["curator"], bonus: [], metric: "speed" },
    },
  },
  {
    id: 2,
    title: 'Детский проект "Правила ПДД"',
    desc: "Особые требования к дизайну и безопасности. Важно качество!",
    metric: "quality",
    threshold: 4,
    maxTurns: 4,
    turnUnit: "месяца",
    reward: { money: 150, social: 1, items: [] },
    shopAfter: [{ id: "energy_node", name: "Энергоузел", price: 120, desc: "Комната зарядки роботов" }],
    specialRules: { robotInRoom3Fail: true },
    correctHint: "В этом проекте качество важнее скорости. Робот в 3-й комнате — провал!",
    roomScoring: {
      1: { needed: ["researcher", "pedagogue"], bonus: ["programmer", "robot"], metric: "quality" },
      2: { needed: ["programmer", "scriptwriter"], bonus: ["robot"], metric: "quality" },
      3: { needed: ["curator"], bonus: ["freelancer"], metric: "quality", robotFail: true },
    },
  },
  {
    id: 3,
    title: "Профессиональная программа переподготовки",
    desc: "Высокая сложность. Требуются опытные методологи.",
    metric: "quality",
    threshold: 6,
    maxTurns: 5,
    turnUnit: "месяцев",
    reward: { money: 200, social: 1, items: [] },
    shopAfter: [],
    specialRules: { freelancerPenaltyRoom2: true, robotInRoom3Fail: true },
    correctHint: "Фрилансер в продакшне снижает качество! Робот без куратора может работать в тестах.",
    roomScoring: {
      1: { needed: ["researcher", "pedagogue"], bonus: ["programmer", "robot"], metric: "quality" },
      2: { needed: ["programmer", "scriptwriter"], bonus: ["robot"], metric: "quality", freelancerPenalty: -0.5 },
      3: { needed: ["curator"], bonus: ["freelancer", "robot"], metric: "quality", robotFailWithCurator: true },
    },
  },
];

const COMIC_SLIDES = [
  {
    text: "2026 год. Мир профессий изменился до неузнаваемости...",
    sub: "Тысячи новых специальностей, ИИ-ассистенты, цифровые команды...",
    bg: "linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 100%)",
    emoji: "🌐",
  },
  {
    text: "Ты стоишь на пороге выбора. Кем стать?",
    sub: "Столько дорог, столько возможностей... Но одно письмо всё изменит.",
    bg: "linear-gradient(135deg, #1a1a4e 0%, #2a1a5e 100%)",
    emoji: "🤔",
  },
  {
    text: '📩 Новое сообщение: "Приглашение на стажировку"',
    sub: "Крупная IT-компания «МегаТех» ищет стажёра — помощника менеджера IT-проектов!",
    bg: "linear-gradient(135deg, #2a1a5e 0%, #0d3b66 100%)",
    emoji: "✉️",
  },
  {
    text: "Управляй командами. Выполняй проекты. Расти!",
    sub: "Распределяй роли, следи за дедлайнами, принимай решения под давлением. Покажи, что ты — будущий IT-менеджер!",
    bg: "linear-gradient(135deg, #0d3b66 0%, #14532d 100%)",
    emoji: "🚀",
  },
];

// ============ STYLES ============
const S = {
  app: {
    fontFamily: "'Segoe UI', 'Noto Sans', sans-serif",
    minHeight: "100vh",
    background: "#0c0c1d",
    color: "#e0e0f0",
    overflow: "hidden",
  },
  btn: (color = "#4A90D9", outline = false) => ({
    padding: "12px 28px",
    borderRadius: 12,
    border: outline ? `2px solid ${color}` : "none",
    background: outline ? "transparent" : `linear-gradient(135deg, ${color}, ${color}dd)`,
    color: outline ? color : "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .2s",
    boxShadow: outline ? "none" : `0 4px 15px ${color}44`,
  }),
  card: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
  },
  glow: (color) => ({
    boxShadow: `0 0 20px ${color}33, 0 0 60px ${color}11`,
  }),
};

// ============ COMPONENTS ============

function TypeWriter({ text, speed = 40, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    const timer = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(timer);
        onDone && onDone();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);
  return <span>{displayed}<span style={{opacity:.5, animation:"blink 1s infinite"}}>▌</span></span>;
}

function MegaAssistant({ message, onClose }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, maxWidth: 380, zIndex: 100,
      ...S.card, padding: 20, borderColor: "#E07CC566",
      animation: "slideUp .4s ease-out",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "linear-gradient(135deg, #E07CC5, #9B59B6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, boxShadow: "0 0 15px #E07CC544",
        }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#E07CC5" }}>МЕГА</div>
          <div style={{ fontSize: 11, opacity: 0.5 }}>ИИ-ассистент</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "#888", cursor: "pointer", fontSize: 18,
          }}>✕</button>
        )}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "#ccc" }}>{message}</div>
    </div>
  );
}

function NotificationBadge({ count, onClick }) {
  return (
    <div onClick={onClick} style={{
      position: "fixed", bottom: 20, left: 20, zIndex: 90,
      width: 60, height: 60, borderRadius: 16,
      background: "linear-gradient(135deg, #1a1a3e, #2a2a5e)",
      border: "1px solid rgba(255,255,255,0.1)",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", fontSize: 28,
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      transition: "transform .2s",
    }}>
      💻
      {count > 0 && (
        <div style={{
          position: "absolute", top: -6, right: -6,
          background: "#e74c3c", borderRadius: "50%",
          width: 22, height: 22, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#fff",
          animation: "pulse 2s infinite",
        }}>{count}</div>
      )}
    </div>
  );
}

function ProgressBar({ value, max, color = "#4A90D9", label }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 8 }}>
      {label && <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 3 }}>{label}</div>}
      <div style={{
        height: 8, borderRadius: 4,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          width: `${pct}%`, transition: "width .5s ease",
        }} />
      </div>
    </div>
  );
}

// ============ SCREENS ============

function RegistrationScreen({ onRegister }) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  return (
    <div style={{
      ...S.app, display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a2a4e 100%)",
    }}>
      <div style={{
        ...S.card, padding: "48px 40px", width: 420, maxWidth: "90vw",
        textAlign: "center", ...S.glow("#4A90D9"),
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🚀</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, background: "linear-gradient(90deg, #4A90D9, #E07CC5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          МЕГА МЕНЕДЖЕР
        </h1>
        <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 32 }}>Профориентационная игра IT-менеджера</p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Твоё имя"
          style={{
            width: "100%", padding: "14px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)", color: "#e0e0f0", fontSize: 15,
            marginBottom: 14, outline: "none", boxSizing: "border-box",
          }}
        />
        <input
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="Группа / класс"
          style={{
            width: "100%", padding: "14px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)", color: "#e0e0f0", fontSize: 15,
            marginBottom: 28, outline: "none", boxSizing: "border-box",
          }}
        />
        <button
          disabled={!name.trim()}
          onClick={() => onRegister({ name: name.trim(), group: group.trim() })}
          style={{
            ...S.btn("#4A90D9"),
            width: "100%",
            opacity: name.trim() ? 1 : 0.4,
            fontSize: 16,
          }}
        >
          Начать путь 🎯
        </button>
      </div>
    </div>
  );
}

function ComicScreen({ onDone }) {
  const [slide, setSlide] = useState(0);
  const [ready, setReady] = useState(false);
  const cur = COMIC_SLIDES[slide];
  return (
    <div style={{
      ...S.app, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: cur.bg, transition: "background 0.8s ease",
      padding: 24,
    }}>
      <div style={{ fontSize: 80, marginBottom: 24, animation: "float 3s ease-in-out infinite" }}>
        {cur.emoji}
      </div>
      <div style={{ maxWidth: 600, textAlign: "center" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12, lineHeight: 1.4 }}>
          <TypeWriter text={cur.text} speed={35} onDone={() => setReady(true)} key={slide} />
        </h2>
        {ready && (
          <p style={{ fontSize: 16, opacity: 0.7, lineHeight: 1.6, animation: "fadeIn .5s" }}>
            {cur.sub}
          </p>
        )}
      </div>
      <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
        {slide > 0 && (
          <button onClick={() => { setSlide(s => s - 1); setReady(false); }} style={S.btn("#555", true)}>← Назад</button>
        )}
        <button
          onClick={() => {
            if (slide < COMIC_SLIDES.length - 1) { setSlide(s => s + 1); setReady(false); }
            else onDone();
          }}
          style={S.btn("#4A90D9")}
        >
          {slide < COMIC_SLIDES.length - 1 ? "Дальше →" : "Выбрать персонажа →"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        {COMIC_SLIDES.map((_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: "50%",
            background: i === slide ? "#4A90D9" : "rgba(255,255,255,0.2)",
            transition: "background .3s",
          }} />
        ))}
      </div>
    </div>
  );
}

function CharacterSelectScreen({ onSelect }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{
      ...S.app, padding: "32px 24px",
      background: "linear-gradient(180deg, #0a0a2e 0%, #0c1a3e 100%)",
      overflowY: "auto",
    }}>
      <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Выбери своего ассистента будущего
      </h2>
      <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 28 }}>
        Каждый стажёр уникален. Выбери того, кто ближе тебе по духу.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16, maxWidth: 960, margin: "0 auto",
      }}>
        {CHARACTERS.map((ch) => (
          <div
            key={ch.id}
            onClick={() => setSelected(ch.id)}
            style={{
              ...S.card,
              padding: "24px 18px",
              cursor: "pointer",
              transition: "all .3s",
              border: selected === ch.id ? `2px solid ${ch.color}` : "1px solid rgba(255,255,255,0.06)",
              ...(selected === ch.id ? S.glow(ch.color) : {}),
              textAlign: "center",
            }}
          >
            <div style={{
              fontSize: 48, marginBottom: 8,
              filter: selected === ch.id ? "none" : "grayscale(0.3)",
            }}>{ch.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: ch.color }}>{ch.name}</div>
            <div style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 20,
              background: `${ch.color}22`, color: ch.color,
              display: "inline-block", marginTop: 4, marginBottom: 8,
            }}>{ch.trait}</div>
            <p style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.5 }}>{ch.desc}</p>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ textAlign: "center", marginTop: 28, animation: "fadeIn .3s" }}>
          <button onClick={() => onSelect(CHARACTERS.find(c => c.id === selected))} style={S.btn(CHARACTERS.find(c => c.id === selected).color)}>
            Начать стажировку с {CHARACTERS.find(c => c.id === selected).name} →
          </button>
        </div>
      )}
    </div>
  );
}

function TutorialScreen({ character, onDone }) {
  return (
    <div style={{
      ...S.app, display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0a0a2e, #0d3b66)",
      padding: 24,
    }}>
      <div style={{ ...S.card, padding: 36, maxWidth: 640, ...S.glow(character.color) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <span style={{ fontSize: 40 }}>{character.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>Привет, {character.name}!</div>
            <div style={{ fontSize: 13, opacity: 0.5 }}>Добро пожаловать в МегаТех</div>
          </div>
        </div>

        <div style={{ fontSize: 14, lineHeight: 1.8, color: "#bbb" }}>
          <p style={{ marginBottom: 14 }}>
            Как стажёру-помощнику менеджера IT-проектов тебе предстоит:
          </p>

          <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
            {[
              ["📋", "Распределять специалистов по комнатам проекта"],
              ["⚡", "Выполнять проекты в жёсткие дедлайны"],
              ["🔄", "Заменять сотрудников, если кто-то выбыл"],
              ["🏆", "Набирать очки, повышать уровень компании"],
              ["💰", "Управлять бюджетом: найм, улучшения, покупки"],
            ].map(([icon, text], i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
              }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, opacity: 0.6 }}>
            Ассистент <b style={{ color: "#E07CC5" }}>МЕГА</b> будет подсказывать тебе на каждом шагу. 
            Уведомления о задачах появляются на компьютере в левом нижнем углу 💻
          </p>
        </div>

        <button onClick={onDone} style={{ ...S.btn(character.color), width: "100%", marginTop: 16 }}>
          Приступить к работе! 🔥
        </button>
      </div>
    </div>
  );
}

// ============ MAIN GAME SCREEN ============

function GameScreen({ player, character, onComplete }) {
  const [gameState, setGameState] = useState({
    level: 1,
    money: 0,
    social: 0,
    xp: 0,
    missionIndex: 0,
    phase: "briefing",
    turnsLeft: MISSIONS[0].maxTurns,
    turnsUsed: 0,
    employees: [
      { id: "e1", type: "researcher", stress: 0, roomsWorked: 0 },
      { id: "e2", type: "pedagogue", stress: 0, roomsWorked: 0 },
      { id: "e3", type: "programmer", stress: 0, roomsWorked: 0 },
      { id: "e4", type: "scriptwriter", stress: 0, roomsWorked: 0 },
      { id: "e5", type: "curator", stress: 0, roomsWorked: 0 },
    ],
    buildings: [],
    assignments: { 1: [], 2: [], 3: [] },
    restAssignments: [],  // employees in rest room this turn
    currentRoom: 1,
    megaMsg: null,
    notifications: [],
    totalScore: 0,
    hasRestRoom: false,  // unlocked after level 1
  });

  const [dragOver, setDragOver] = useState(null);

  const gs = gameState;
  const mission = MISSIONS[gs.missionIndex];
  const update = (patch) => setGameState((s) => ({ ...s, ...patch }));

  const getEmployee = (id) => gs.employees.find((e) => e.id === id);
  const getEmpInfo = (type) => EMPLOYEES[type];

  const assignToRoom = (empId, roomId) => {
    // Remove from work rooms and rest room first
    const newAssign = { ...gs.assignments };
    for (const r of [1, 2, 3]) {
      newAssign[r] = newAssign[r].filter((id) => id !== empId);
    }
    const newRest = gs.restAssignments.filter((id) => id !== empId);

    if (roomId === "rest") {
      update({ assignments: newAssign, restAssignments: [...newRest, empId] });
    } else {
      if (newAssign[roomId].length >= 3) return;
      newAssign[roomId] = [...newAssign[roomId], empId];
      update({ assignments: newAssign, restAssignments: newRest });
    }
  };

  const removeFromRoom = (empId) => {
    const newAssign = { ...gs.assignments };
    for (const r of [1, 2, 3]) {
      newAssign[r] = newAssign[r].filter((id) => id !== empId);
    }
    const newRest = gs.restAssignments.filter((id) => id !== empId);
    update({ assignments: newAssign, restAssignments: newRest });
  };

  const getAssignedRoom = (empId) => {
    if (gs.restAssignments.includes(empId)) return "rest";
    for (const r of [1, 2, 3]) {
      if (gs.assignments[r].includes(empId)) return r;
    }
    return null;
  };

  const calculateScore = () => {
    let totalMetric = 0;
    let failed = false;
    let failReason = "";

    for (const room of ROOMS) {
      const assigned = gs.assignments[room.id].map((id) => getEmployee(id));
      const scoring = mission.roomScoring[room.id];
      let roomScore = 0;

      for (const emp of assigned) {
        if (!emp) continue;
        const info = getEmpInfo(emp.type);
        const isHome = info.rooms.includes(room.id);
        const metric = mission.metric;

        if (info.universal) {
          if (emp.type === "robot" && scoring.robotFail) {
            failed = true;
            failReason = `Робот в комнате "${room.name}" — провал! Куратор не доверяет роботам.`;
          } else if (emp.type === "robot" && scoring.robotFailWithCurator) {
            const hasCurator = assigned.some((e) => e.type === "curator");
            if (hasCurator) {
              failed = true;
              failReason = `Робот с куратором в комнате "${room.name}" — куратор не доверяет роботам!`;
            } else {
              roomScore += info[metric];
            }
          } else if (emp.type === "freelancer" && scoring.freelancerPenalty) {
            roomScore += info[metric] + scoring.freelancerPenalty;
          } else {
            roomScore += info[metric];
          }
        } else if (isHome) {
          roomScore += info[metric];
        } else {
          roomScore += (info[`helper${metric.charAt(0).toUpperCase() + metric.slice(1)}`] || 0.5);
        }
      }
      totalMetric += roomScore;
    }

    return { totalMetric, failed, failReason };
  };

  const submitAssignment = () => {
    const { totalMetric, failed, failReason } = calculateScore();
    const passed = !failed && totalMetric >= mission.threshold;
    const newTurnsLeft = gs.turnsLeft - 1;
    const newTurnsUsed = gs.turnsUsed + 1;

    // Apply stress changes: +1 for workers, -1 for resting (min 0)
    let newEmployees = gs.employees.map((emp) => {
      const room = getAssignedRoom(emp.id);
      if (room === "rest") {
        return { ...emp, stress: Math.max(0, emp.stress - 1) };
      } else if (room !== null) {
        return { ...emp, stress: emp.stress + 1, roomsWorked: emp.roomsWorked + 1 };
      }
      return emp;
    });

    if (passed) {
      const newMoney = gs.money + mission.reward.money;
      const newSocial = gs.social + mission.reward.social;
      let addEmployees = [];
      if (mission.reward.items.includes("robot")) {
        addEmployees = [{ id: `robot_${Date.now()}`, type: "robot", stress: 0, roomsWorked: 0 }];
      }
      update({
        phase: "result",
        employees: [...newEmployees, ...addEmployees],
        money: newMoney,
        social: newSocial,
        level: gs.level + 1,
        xp: gs.xp + mission.reward.money * 2,
        totalScore: gs.totalScore + Math.round(totalMetric * 100),
        turnsLeft: newTurnsLeft,
        turnsUsed: newTurnsUsed,
        megaMsg: `🎉 Проект "${mission.title}" выполнен за ${newTurnsUsed} ${mission.turnUnit}! +${mission.reward.money}к 💰 +${mission.reward.social} соц. балл!`,
        notifications: [],
        hasRestRoom: gs.level >= 1, // unlock rest room after completing level 1
      });
    } else if (newTurnsLeft <= 0) {
      // Out of turns — mission failed
      update({
        phase: "timeout",
        employees: newEmployees,
        turnsLeft: 0,
        turnsUsed: newTurnsUsed,
        megaMsg: `⏰ Время вышло! Проект "${mission.title}" не сдан в срок.`,
      });
    } else {
      // Failed this turn, but turns remain
      const reason = failed ? failReason : `Метрика ${totalMetric.toFixed(1)} < ${mission.threshold}.`;
      update({
        megaMsg: `❌ Ход не засчитан: ${reason} Осталось ${newTurnsLeft} ${mission.turnUnit}. Перераспредели команду!`,
        assignments: { 1: [], 2: [], 3: [] },
        restAssignments: [],
        employees: newEmployees,
        turnsLeft: newTurnsLeft,
        turnsUsed: newTurnsUsed,
      });
    }
  };

  const buyItem = (item) => {
    if (gs.money >= item.price) {
      update({
        money: gs.money - item.price,
        buildings: [...gs.buildings, item.id],
        megaMsg: `✅ Куплено: ${item.name}! ${item.desc}`,
      });
    }
  };

  const hireFreelancer = () => {
    const maxFree = gs.social;
    const currentFree = gs.employees.filter((e) => e.type === "freelancer").length;
    if (currentFree < maxFree && gs.money >= 20) {
      update({
        money: gs.money - 20,
        employees: [...gs.employees, { id: `free_${Date.now()}`, type: "freelancer", stress: 0, roomsWorked: 0 }],
        megaMsg: "🧳 Нанят фрилансер!",
      });
    }
  };

  const nextMission = () => {
    if (gs.missionIndex + 1 < MISSIONS.length) {
      let newEmps = [...gs.employees];
      let departed = [];

      if (!gs.buildings.includes("rest_zone")) {
        const stressed = newEmps.filter((e) => e.stress >= 2 && e.type !== "robot" && e.type !== "freelancer");
        if (stressed.length > 0) {
          departed.push(stressed[0]);
          newEmps = newEmps.filter((e) => e.id !== stressed[0].id);
        }
      }

      newEmps = newEmps.filter((e) => {
        if (e.type === "freelancer" && e.roomsWorked >= 5) {
          departed.push(e);
          return false;
        }
        return true;
      });

      if (gs.buildings.includes("energy_node")) {
        newEmps = newEmps.map((e) => {
          if (e.type === "robot" && e.roomsWorked >= 3) {
            return { ...e, roomsWorked: 0 };
          }
          return e;
        });
      }

      const msg = departed.length > 0
        ? `⚠️ ${departed.map((d) => getEmpInfo(d.type).name).join(", ")} покинули команду!`
        : null;

      const nextMission = MISSIONS[gs.missionIndex + 1];
      update({
        missionIndex: gs.missionIndex + 1,
        phase: "briefing",
        assignments: { 1: [], 2: [], 3: [] },
        restAssignments: [],
        employees: newEmps,
        megaMsg: msg,
        currentRoom: 1,
        turnsLeft: nextMission.maxTurns,
        turnsUsed: 0,
        hasRestRoom: true, // always available from mission 2 onward
      });
    } else {
      onComplete(gs);
    }
  };

  // ---- RENDER ----
  if (gs.phase === "briefing") {
    return (
      <div style={{ ...S.app, padding: 24, overflowY: "auto", background: "linear-gradient(180deg, #0a0a2e, #0c1a3e)" }}>
        <HUD gs={gs} player={player} character={character} />
        <div style={{ maxWidth: 640, margin: "80px auto 0" }}>
          <div style={{ ...S.card, padding: 32, ...S.glow("#4A90D9") }}>
            <div style={{ fontSize: 12, color: "#4A90D9", fontWeight: 600, marginBottom: 8 }}>
              📋 УРОВЕНЬ {gs.level} — НОВЫЙ ПРОЕКТ
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{mission.title}</h2>
            <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.6, marginBottom: 16 }}>{mission.desc}</p>

            <div style={{
              display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap",
            }}>
              <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", fontSize: 13 }}>
                Метрика: <b style={{ color: mission.metric === "speed" ? "#f0a030" : "#56b870" }}>
                  {mission.metric === "speed" ? "⚡ Скорость" : "💎 Качество"}
                </b>
              </div>
              <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", fontSize: 13 }}>
                Порог: <b>{mission.threshold}</b>
              </div>
              <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", fontSize: 13 }}>
                Награда: <b style={{ color: "#f0a030" }}>{mission.reward.money}к 💰</b>
              </div>
              <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(231,76,60,0.12)", border: "1px solid rgba(231,76,60,0.25)", fontSize: 13 }}>
                ⏳ Срок: <b style={{ color: "#e74c3c" }}>{mission.maxTurns} {mission.turnUnit}</b>
              </div>
            </div>

            {/* Turn progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>⏳ Осталось ходов</span>
                <span style={{ color: gs.turnsLeft <= 1 ? "#e74c3c" : gs.turnsLeft <= 2 ? "#f0a030" : "#56B870" }}>
                  {gs.turnsLeft} / {mission.maxTurns} {mission.turnUnit}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  background: gs.turnsLeft <= 1 ? "#e74c3c" : gs.turnsLeft <= 2 ? "#f0a030" : "#56B870",
                  width: `${(gs.turnsLeft / mission.maxTurns) * 100}%`,
                  transition: "width .5s ease, background .3s",
                }} />
              </div>
            </div>

            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(224,124,197,0.08)", border: "1px solid rgba(224,124,197,0.2)",
              fontSize: 13, color: "#E07CC5", marginBottom: 20,
            }}>
              💡 <b>МЕГА подсказывает:</b> {mission.correctHint}
            </div>

            <button onClick={() => update({ phase: "assign" })} style={{ ...S.btn("#4A90D9"), width: "100%" }}>
              Распределить команду →
            </button>
          </div>
        </div>
        <MegaAssistant message={gs.megaMsg} onClose={() => update({ megaMsg: null })} />
      </div>
    );
  }

  if (gs.phase === "assign") {
    const handleDragStart = (e, empId) => {
      e.dataTransfer.setData("empId", empId);
      e.dataTransfer.effectAllowed = "move";
    };

    const handleDropOnRoom = (e, roomId) => {
      e.preventDefault();
      setDragOver(null);
      const empId = e.dataTransfer.getData("empId");
      if (empId) assignToRoom(empId, roomId);
    };

    const handleDropOnPool = (e) => {
      e.preventDefault();
      setDragOver(null);
      const empId = e.dataTransfer.getData("empId");
      if (empId) removeFromRoom(empId);
    };

    return (
      <div style={{ ...S.app, padding: "16px", overflowY: "auto", background: "linear-gradient(180deg, #0a0a2e, #0c1a3e)" }}>
        <HUD gs={gs} player={player} character={character} />

        <div style={{ maxWidth: 900, margin: "72px auto 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 14, opacity: 0.7 }}>
              📋 {mission.title}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20,
              background: gs.turnsLeft <= 1 ? "rgba(231,76,60,0.2)" : gs.turnsLeft <= 2 ? "rgba(240,160,48,0.15)" : "rgba(86,184,112,0.12)",
              border: `1px solid ${gs.turnsLeft <= 1 ? "rgba(231,76,60,0.5)" : gs.turnsLeft <= 2 ? "rgba(240,160,48,0.4)" : "rgba(86,184,112,0.3)"}`,
              fontSize: 13, fontWeight: 600,
              color: gs.turnsLeft <= 1 ? "#e74c3c" : gs.turnsLeft <= 2 ? "#f0a030" : "#56B870",
            }}>
              ⏳ Осталось: {gs.turnsLeft} {mission.turnUnit}
            </div>
          </div>

          {/* Rooms — drop targets */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12, marginBottom: 20 }}>
            {WORK_ROOMS.map((room) => {
              const isOver = dragOver === room.id;
              const isFull = gs.assignments[room.id].length >= room.maxWorkers;
              return (
                <div
                  key={room.id}
                  onDragOver={(e) => { e.preventDefault(); if (!isFull) setDragOver(room.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDropOnRoom(e, room.id)}
                  style={{
                    ...S.card, padding: 16,
                    border: isOver
                      ? `2px dashed ${character.color}`
                      : gs.currentRoom === room.id
                        ? `2px solid ${character.color}`
                        : "1px solid rgba(255,255,255,0.06)",
                    background: isOver ? `${character.color}11` : "rgba(255,255,255,0.05)",
                    transition: "all .15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>{room.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Комната {room.id}</div>
                      <div style={{ fontSize: 11, opacity: 0.5 }}>{room.name}</div>
                    </div>
                    <div style={{
                      marginLeft: "auto", fontSize: 11, padding: "3px 8px",
                      borderRadius: 6,
                      background: isFull ? "rgba(231,76,60,0.2)" : "rgba(255,255,255,0.06)",
                      color: isFull ? "#e74c3c" : undefined,
                    }}>
                      {gs.assignments[room.id].length}/{room.maxWorkers}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, minHeight: 56, flexWrap: "wrap", alignContent: "flex-start" }}>
                    {gs.assignments[room.id].map((empId) => {
                      const emp = getEmployee(empId);
                      if (!emp) return null;
                      const info = getEmpInfo(emp.type);
                      return (
                        <div
                          key={empId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, empId)}
                          onClick={() => removeFromRoom(empId)}
                          style={{
                            padding: "6px 10px", borderRadius: 8,
                            background: "rgba(255,255,255,0.08)",
                            fontSize: 12, cursor: "grab",
                            display: "flex", alignItems: "center", gap: 4,
                            border: `1px solid ${info.rooms.includes(room.id) || info.universal ? "rgba(86,184,112,0.3)" : "rgba(231,76,60,0.3)"}`,
                            userSelect: "none",
                          }}
                          title="Перетащи или нажми чтобы убрать"
                        >
                          {info.emoji} {info.name}
                          <span style={{ opacity: 0.4, fontSize: 10 }}>✕</span>
                        </div>
                      );
                    })}
                    {gs.assignments[room.id].length === 0 && (
                      <div style={{
                        fontSize: 12, opacity: isOver ? 0.7 : 0.3, padding: 8,
                        color: isOver ? character.color : undefined,
                        transition: "all .15s",
                      }}>
                        {isOver ? "⬇ Отпусти здесь" : "Перетащи сюда сотрудников"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rest Room — shown from mission 2 onward */}
          {gs.hasRestRoom && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver("rest"); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); const id = e.dataTransfer.getData("empId"); if (id) assignToRoom(id, "rest"); }}
              style={{
                ...S.card, padding: 16, marginBottom: 20,
                border: dragOver === "rest" ? "2px dashed #56B87088" : "1px solid rgba(86,184,112,0.2)",
                background: dragOver === "rest" ? "rgba(86,184,112,0.1)" : "rgba(86,184,112,0.04)",
                transition: "all .15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>🛋️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#56B870" }}>Комната отдыха</div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>Снижает усталость сотрудника на 1 за ход</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(86,184,112,0.15)", color: "#56B870" }}>
                  {gs.restAssignments.length} отдыхают
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, minHeight: 44, flexWrap: "wrap", alignContent: "flex-start" }}>
                {gs.restAssignments.map((empId) => {
                  const emp = gs.employees.find(e => e.id === empId);
                  if (!emp) return null;
                  const info = EMPLOYEES[emp.type];
                  return (
                    <div
                      key={empId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, empId)}
                      onClick={() => removeFromRoom(empId)}
                      style={{
                        padding: "6px 10px", borderRadius: 8,
                        background: "rgba(86,184,112,0.12)",
                        fontSize: 12, cursor: "grab",
                        display: "flex", alignItems: "center", gap: 4,
                        border: "1px solid rgba(86,184,112,0.3)",
                        userSelect: "none",
                      }}
                      title="Перетащи или нажми чтобы убрать"
                    >
                      {info.emoji} {info.name}
                      {emp.stress > 0 && <span style={{ fontSize: 10, color: "#f0a030" }}>😓→{Math.max(0, emp.stress - 1)}</span>}
                      <span style={{ opacity: 0.4, fontSize: 10 }}>✕</span>
                    </div>
                  );
                })}
                {gs.restAssignments.length === 0 && (
                  <div style={{ fontSize: 12, opacity: dragOver === "rest" ? 0.7 : 0.3, padding: 8, color: dragOver === "rest" ? "#56B870" : undefined }}>
                    {dragOver === "rest" ? "⬇ Отпусти здесь" : "Перетащи уставших сотрудников для отдыха"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Employee pool — also a drop target (to unassign) */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver("pool"); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={handleDropOnPool}
            style={{
              ...S.card, padding: 16, marginBottom: 16,
              border: dragOver === "pool" ? "2px dashed rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
              background: dragOver === "pool" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
              transition: "all .15s",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              👥 Команда
              <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.5, marginLeft: 8 }}>
                — перетащи в комнату или нажми кнопку
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {gs.employees.map((emp) => {
                const info = getEmpInfo(emp.type);
                const assigned = getAssignedRoom(emp.id);
                return (
                  <div key={emp.id} style={{ position: "relative" }}>
                    <div
                      draggable={assigned === null}
                      onDragStart={(e) => assigned === null && handleDragStart(e, emp.id)}
                      style={{
                        padding: "8px 12px", borderRadius: 10,
                        background: assigned !== null ? "rgba(74,144,217,0.15)" : "rgba(255,255,255,0.06)",
                        border: assigned !== null ? "1px solid rgba(74,144,217,0.3)" : "1px solid rgba(255,255,255,0.08)",
                        fontSize: 13,
                        cursor: assigned !== null ? "default" : "grab",
                        display: "flex", alignItems: "center", gap: 6,
                        opacity: assigned !== null ? 0.45 : 1,
                        userSelect: "none",
                        transition: "opacity .2s",
                      }}
                    >
                      <span>{info.emoji}</span>
                      <span>{info.name}</span>
                      {emp.stress > 0 && <span style={{ fontSize: 10, color: "#e74c3c" }}>😓{emp.stress}</span>}
                    </div>
                    {assigned === null && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {WORK_ROOMS.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => assignToRoom(emp.id, r.id)}
                            style={{
                              padding: "3px 8px", borderRadius: 6, border: "none",
                              background: "rgba(255,255,255,0.08)", color: "#aaa",
                              fontSize: 10, cursor: "pointer",
                            }}
                          >
                            →К{r.id}
                          </button>
                        ))}
                        {gs.hasRestRoom && (
                          <button
                            onClick={() => assignToRoom(emp.id, "rest")}
                            style={{
                              padding: "3px 8px", borderRadius: 6, border: "none",
                              background: "rgba(86,184,112,0.15)", color: "#56B870",
                              fontSize: 10, cursor: "pointer",
                            }}
                          >
                            →🛋️
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={submitAssignment} style={{ ...S.btn("#56B870"), flex: 1 }}>
              ✅ Запустить проект
            </button>
            <button onClick={() => update({ assignments: { 1: [], 2: [], 3: [] }, restAssignments: [] })} style={S.btn("#666", true)}>
              🔄 Сбросить
            </button>
          </div>
        </div>

        <MegaAssistant message={gs.megaMsg} onClose={() => update({ megaMsg: null })} />
      </div>
    );
  }

  if (gs.phase === "result") {
    return (
      <div style={{
        ...S.app, display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a2e, #14532d)",
        padding: 24,
      }}>
        <div style={{ ...S.card, padding: 36, maxWidth: 540, textAlign: "center", ...S.glow("#56B870") }}>
          <div style={{ fontSize: 64, marginBottom: 12, animation: "float 2s ease-in-out infinite" }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Проект завершён!</h2>
          <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 24 }}>{mission.title}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              ["💰", "Прибыль", `${mission.reward.money}к`],
              ["⭐", "Соц. баллы", `+${mission.reward.social}`],
              ["📈", "Уровень", gs.level],
              ["🏆", "Очки", gs.totalScore],
            ].map(([icon, label, val], i) => (
              <div key={i} style={{
                padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.06)", textAlign: "center",
              }}>
                <div style={{ fontSize: 22 }}>{icon}</div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{val}</div>
              </div>
            ))}
          </div>

          {(mission.shopAfter.length > 0 || gs.money >= 20) && (
            <div style={{
              ...S.card, padding: 16, marginBottom: 16, textAlign: "left",
              border: "1px solid rgba(240,160,48,0.2)",
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "#f0a030" }}>🛒 Магазин</div>

              {mission.shopAfter.map((item) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", marginBottom: 8,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{item.desc}</div>
                  </div>
                  <button
                    onClick={() => buyItem(item)}
                    disabled={gs.money < item.price || gs.buildings.includes(item.id)}
                    style={{
                      ...S.btn(gs.buildings.includes(item.id) ? "#555" : "#f0a030"),
                      padding: "8px 14px", fontSize: 12,
                      opacity: gs.money < item.price ? 0.4 : 1,
                    }}
                  >
                    {gs.buildings.includes(item.id) ? "✅" : `${item.price}к`}
                  </button>
                </div>
              ))}

              {gs.money >= 20 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>🧳 Фрилансер</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>Универсал на 5 этапов (макс: {gs.social})</div>
                  </div>
                  <button onClick={hireFreelancer} style={{ ...S.btn("#9B59B6"), padding: "8px 14px", fontSize: 12 }}>
                    20к
                  </button>
                </div>
              )}

              <div style={{ fontSize: 12, opacity: 0.5, marginTop: 8, textAlign: "center" }}>
                💰 Баланс: {gs.money}к
              </div>
            </div>
          )}

          <button onClick={nextMission} style={{ ...S.btn("#4A90D9"), width: "100%" }}>
            {gs.missionIndex + 1 < MISSIONS.length ? "Следующий проект →" : "Завершить стажировку →"}
          </button>
        </div>
        <MegaAssistant message={gs.megaMsg} onClose={() => update({ megaMsg: null })} />
      </div>
    );
  }

  if (gs.phase === "timeout") {
    return (
      <div style={{
        ...S.app, display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a2e, #3a0a0a)",
        padding: 24,
      }}>
        <div style={{ ...S.card, padding: 36, maxWidth: 500, textAlign: "center", boxShadow: "0 0 30px rgba(231,76,60,0.2)" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>⏰</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#e74c3c" }}>Дедлайн пропущен!</h2>
          <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 24, lineHeight: 1.6 }}>
            Проект <b>"{mission.title}"</b> не был сдан за отведённые {mission.maxTurns} {mission.turnUnit}.<br />
            Клиент недоволен, но стажировка продолжается.
          </p>
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.2)",
            fontSize: 13, color: "#e74c3c", marginBottom: 24,
          }}>
            🤖 <b>МЕГА:</b> Следующий раз распредели команду эффективнее с самого начала — время ограничено!
          </div>
          <button
            onClick={() => {
              const nextIdx = gs.missionIndex + 1;
              if (nextIdx < MISSIONS.length) {
                update({
                  missionIndex: nextIdx,
                  phase: "briefing",
                  assignments: { 1: [], 2: [], 3: [] },
                  restAssignments: [],
                  turnsLeft: MISSIONS[nextIdx].maxTurns,
                  turnsUsed: 0,
                  megaMsg: null,
                  hasRestRoom: true,
                });
              } else {
                onComplete(gs);
              }
            }}
            style={{ ...S.btn("#4A90D9"), width: "100%" }}
          >
            {gs.missionIndex + 1 < MISSIONS.length ? "Следующий проект →" : "Завершить стажировку →"}
          </button>
        </div>
        <MegaAssistant message={gs.megaMsg} onClose={() => update({ megaMsg: null })} />
      </div>
    );
  }

  return null;
}

function HUD({ gs, player, character }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 80,
      padding: "10px 20px",
      background: "linear-gradient(180deg, rgba(10,10,30,0.95), rgba(10,10,30,0.7))",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22 }}>{character.emoji}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{player.name}</div>
          <div style={{ fontSize: 10, opacity: 0.5 }}>Ур. {gs.level}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginLeft: "auto", fontSize: 13, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {gs.turnsLeft !== undefined && gs.phase === "assign" && (
          <span style={{ color: gs.turnsLeft <= 1 ? "#e74c3c" : gs.turnsLeft <= 2 ? "#f0a030" : "#56B870", fontWeight: 700 }}>
            ⏳ {gs.turnsLeft}
          </span>
        )}
        <span>💰 {gs.money}к</span>
        <span>⭐ {gs.social}</span>
        <span>🏆 {gs.totalScore}</span>
        <span>👥 {gs.employees.length}</span>
      </div>
    </div>
  );
}

function EndScreen({ gs, player, character }) {
  return (
    <div style={{
      ...S.app, display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0a0a2e, #2a0a4e)",
      padding: 24,
    }}>
      <div style={{ ...S.card, padding: 40, maxWidth: 540, textAlign: "center", ...S.glow("#E07CC5") }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
        <h1 style={{
          fontSize: 28, fontWeight: 800, marginBottom: 8,
          background: "linear-gradient(90deg, #4A90D9, #E07CC5, #f0a030)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Стажировка завершена!
        </h1>
        <p style={{ fontSize: 15, opacity: 0.6, marginBottom: 28 }}>
          {player.name}, ты прошёл путь от стажёра до помощника менеджера IT-проектов!
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            ["📈", "Уровень", gs.level],
            ["💰", "Заработок", `${gs.money}к`],
            ["🏆", "Очки", gs.totalScore],
          ].map(([icon, label, val], i) => (
            <div key={i} style={{
              padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.06)",
            }}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{
          padding: 16, borderRadius: 12,
          background: "rgba(86,184,112,0.1)", border: "1px solid rgba(86,184,112,0.2)",
          fontSize: 14, lineHeight: 1.6, marginBottom: 20,
        }}>
          <b style={{ color: "#56B870" }}>Ты узнал, что IT-менеджер:</b><br />
          📋 Распределяет роли в команде<br />
          ⏰ Работает в жёстких дедлайнах<br />
          🔄 Готов заменить любого участника<br />
          💡 Принимает стратегические решения<br />
          📊 Управляет бюджетом и ресурсами
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 18px", borderRadius: 12,
          background: "rgba(224,124,197,0.08)", border: "1px solid rgba(224,124,197,0.2)",
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 28 }}>🤖</span>
          <div style={{ textAlign: "left", fontSize: 13, color: "#E07CC5" }}>
            <b>МЕГА:</b> Отличная работа, {player.name}! Ты настоящий менеджер будущего! 🚀
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          style={S.btn("#4A90D9")}
        >
          Начать заново 🔄
        </button>
      </div>
    </div>
  );
}

// ============ MAIN APP ============

export default function App() {
  const [screen, setScreen] = useState("register");
  const [player, setPlayer] = useState(null);
  const [character, setCharacter] = useState(null);
  const [finalState, setFinalState] = useState(null);

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        button:hover { filter: brightness(1.1); transform: translateY(-1px); }
        button:active { transform: translateY(0); }
      `}</style>

      {screen === "register" && (
        <RegistrationScreen onRegister={(p) => { setPlayer(p); setScreen("comic"); }} />
      )}
      {screen === "comic" && <ComicScreen onDone={() => setScreen("character")} />}
      {screen === "character" && (
        <CharacterSelectScreen onSelect={(ch) => { setCharacter(ch); setScreen("tutorial"); }} />
      )}
      {screen === "tutorial" && (
        <TutorialScreen character={character} onDone={() => setScreen("game")} />
      )}
      {screen === "game" && (
        <GameScreen
          player={player}
          character={character}
          onComplete={(gs) => { setFinalState(gs); setScreen("end"); }}
        />
      )}
      {screen === "end" && <EndScreen gs={finalState} player={player} character={character} />}
    </>
  );
}
