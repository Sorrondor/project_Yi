import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DoorPortal, DOOR_TRANSITION_MS } from "./components/DoorPortal.tsx";
import "./App.css";

type Room = {
  id: string;
  kicker: string;
  title: string;
  lines: string[];
  mono?: string;
  showHero?: boolean;
  cta: string;
};

const ROOMS: Room[] = [
  {
    id: "threshold",
    kicker: "0 — 시공",
    title: "몇 층 몇 호",
    lines: [
      "이 공간은 평행한 벽과 계단이 서로를 부정합니다.",
      "당신이 앉은 자리는 방인지 복도인지, 창문인지 문인지 아직 이름이 없습니다.",
    ],
    mono: "void floor(); // 층수는 붕괴했다",
    showHero: true,
    cta: "문을 연다",
  },
  {
    id: "deform",
    kicker: "1 — 기형도",
    title: "대칭의 상처",
    lines: [
      "거울은 양쪽을 맞추려다 오히려 어긋남을 증명합니다.",
      "클릭은 작은 지진입니다. 화면이 갈라지면 다음 방이 드러납니다.",
    ],
    mono: "symmetry = fracture;",
    cta: "다음 방으로",
  },
  {
    id: "loss",
    kicker: "2 — 포작",
    title: "빈 자리의 무게",
    lines: [
      "빼앗김은 한 번에 오지 않습니다. 조금씩, 조금씩, 흔적만 남습니다.",
      "이곳의 문은 열릴 때마다 이전 화면을 덮어씁니다.",
    ],
    mono: "absence++;",
    cta: "더 깊이",
  },
  {
    id: "wing",
    kicker: "3 — 날개",
    title: "밤의 복도",
    lines: [
      "긴 복도 끝에서 바람이 문지방 아래로 스며듭니다.",
      "날개는 달리는 것이 아니라, 떨어지지 않기 위한 각도입니다.",
    ],
    mono: "while (night) { drift(); }",
    cta: "끝의 문",
  },
  {
    id: "return",
    kicker: "4 — 회귀",
    title: "다시 처음으로",
    lines: [
      "마지막 문 뒤에는 첫 방의 냄새가 납니다.",
      "이상의 기하학은 끝나지 않고, 같은 질문을 다른 각도로 던집니다.",
    ],
    mono: "return threshold;",
    cta: "처음으로 돌아가기",
  },
];

export default function App() {
  const [index, setIndex] = useState(0);
  const [doorsClosed, setDoorsClosed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const lockRef = useRef(false);
  const room = ROOMS[index]!;

  const advance = useCallback(() => {
    if (lockRef.current) return;
    lockRef.current = true;
    setIsBusy(true);
    setDoorsClosed(true);

    window.setTimeout(() => {
      setIndex((i) => (i + 1) % ROOMS.length);
      setDoorsClosed(false);

      window.setTimeout(() => {
        lockRef.current = false;
        setIsBusy(false);
      }, DOOR_TRANSITION_MS);
    }, DOOR_TRANSITION_MS);
  }, []);

  return (
    <div className="app">
      <div className="grain" />

      <div className="pendulum" aria-hidden="true">
        <span className="pendulum-line" />
        <span className="pendulum-bob" />
      </div>

      <DoorPortal closed={doorsClosed} />

      <main className="stage">
        <div className="grid-scaffold" aria-hidden="true">
          <span className="block b1" />
          <span className="block b2" />
          <span className="block b3" />
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={room.id}
            className="room"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {room.showHero ? (
              <div className="hero-wrap">
                <div className="hero-frame">
                  <img
                    src="/room-hero.png"
                    alt=""
                    className="hero-img"
                    decoding="async"
                  />
                </div>
              </div>
            ) : null}

            <p className="kicker">{room.kicker}</p>
            <h1 className="title">{room.title}</h1>

            <div className="prose">
              {room.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

            {room.mono ? (
              <pre className="mono" role="note">
                {room.mono}
              </pre>
            ) : null}

            <div className="portal-row">
              <button
                type="button"
                className="portal"
                onClick={advance}
                disabled={isBusy}
              >
                <span className="portal-arch" />
                <span className="portal-label">{room.cta}</span>
                <span className="portal-hint">클릭 · 문이 열립니다</span>
              </button>
            </div>
          </motion.article>
        </AnimatePresence>

        <footer className="foot">
          <span className="foot-plant" aria-hidden="true" />
          <span>
            {index + 1} / {ROOMS.length}
          </span>
          <span className="foot-sphere" aria-hidden="true" />
        </footer>
      </main>
    </div>
  );
}
