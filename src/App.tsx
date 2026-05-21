import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DoorPortal, DOOR_TRANSITION_MS } from "./components/DoorPortal.tsx";
import {
  appendSubmission,
  loadInbox,
  loadPublishedIds,
  publishEntry,
  unpublishEntry,
  deleteEntry,
  type ArchiveEntry,
} from "./archiveStorage.ts";
import "./App.css";

type Room = {
  id: string;
  kicker: string;
  title: string;
  lines: string[];
  mono?: string;
  heroSrc?: string;
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
    mono: `void floor();
level = null;
name = "unassigned";`,
    heroSrc: "/room-hero.png",
    cta: "문을 연다",
  },
  {
    id: "deform",
    kicker: "1 — 미동",
    title: "대칭의 파기",
    lines: [
      "거울같은 대칭은, 미동과 함께 어긋납니다.",
      "클릭은 작은 지진입니다. 화면이 갈라지면 다음 방이 드러납니다.",
    ],
    mono: `symmetry = mirror(left, right);
microShift += tremor;
symmetry = fracture;`,
    cta: "다음 방으로",
  },
  {
    id: "deferral",
    kicker: "2 — 유예",
    title: "변화하는 점",
    lines: [
      "나는 영원히 도착하길 유예하며, 매 순간 다른 점으로 환산됩니다.",
      "이 곳의 문은 열릴 때마다 이전 장면을 새로운 각도로 덮어씁니다.",
    ],
    mono: `arrival = defer(arrival, Infinity);
point = transmute(point);
trace = project(point);`,
    cta: "더 깊이",
  },
  {
    id: "wing",
    kicker: "3 — 날개",
    title: "밤의 복도",
    lines: [
      "긴 복도 끝에서 바람이 문지방 아래로 스며듭니다.",
      "날개는 달리는 것이 아니라, 앞을 향하여 흐르는 기울기입니다.",
    ],
    mono: `while (night) {
  drift();
  incline += wind;
}`,
    cta: "끝의 문",
  },
  {
    id: "found",
    kicker: "4 — 습득",
    title: "낙하한 문장",
    lines: [
      "긴 길의 가장자리에서 접힌 종이 한 장을 주웠습니다.",
      "누군가 버린 줄 알았으나, 문장은 아직 체온을 지니고 있었습니다.",
    ],
    mono: `paper = pick("roadside");
ink = warm(paper);
author = unknown;`,
    heroSrc: "/found-hero.png",
    cta: "다음 장면으로",
  },
  {
    id: "wing-origin",
    kicker: "5 — 원문",
    title: "날개",
    lines: [
      "나는 불현듯 겨드랑이가 가렵다. 아하, 그것은 내 인공의 날개가 돋았던 자국이다.",
      "오늘은 없는 이 날개. 머릿속에서는 희망과 야심이 말소된 페이지가 딕셔너리 넘어가듯 번뜩였다. 나는 걷던 걸음을 멈추고 그리고 일어나 한 번 이렇게 외쳐보고 싶었다.",
      "날개야 다시 돋아라.",
      "날자. 날자. 한 번만 더 날자꾸나.",
      "한 번만 더 날아 보자꾸나.",
    ],
    mono: `itch = recall(artificialWing.scar);
if (!wing.exists(today)) {
  hope.erase();
  ambition.erase();
}
mind.flash("deleted pages");
shout("날개야 다시 돋아라");
attemptFlight(1);`,
    cta: "회귀의 문으로",
  },
  {
    id: "return",
    kicker: "6 — 회귀",
    title: "다시 처음으로",
    lines: [
      "마지막 문 뒤에는 첫 방의 온도가 느껴집니다.",
      "이상의 기하학은 끝나지 않고, 같은 질문을 다른 각도에서 던집니다.",
    ],
    mono: `question = rotate(question, angle + 1);
origin = measure(firstRoom);
return threshold;`,
    cta: "다음 장으로..",
  },
  {
    id: "record",
    kicker: "7 — 기록지",
    title: "여백의 페이지",
    lines: [
      "여기는 당신의 문장만 남는 방입니다.",
      "떠오른 생각을 적어 두면, 다음 문을 열어도 잉크의 결은 남아 있습니다.",
      "카카오톡 공유와 관리자 전송만 입실 절차(로그인)가 필요합니다.",
    ],
    mono: `sheet.open();
thought = capture(now);
archive.append(thought);
if (thought.length > 0) {
  trace = "retained";
}`,
    cta: "보관소로",
  },
  {
    id: "login",
    kicker: "8 — 인증",
    title: "입실 절차",
    lines: [
      "기록은 로그인 없이 남길 수 있습니다.",
      "카카오톡으로 보내거나 관리자에게 전달할 때만, 아이디와 비밀번호가 요청됩니다.",
    ],
    mono: `identity = request(id, password);
if (identity.valid) {
  share.unlock();
  mail.unlock();
}
nickname = attach(identity);`,
    cta: "기록지로 돌아가기",
  },
  {
    id: "archive",
    kicker: "9 — 보관소",
    title: "관리자 기록지 보관소",
    lines: [
      "관리자는 메일 등으로 접수된 기록지를 검토한 뒤, 선별한 문장만 이 보관소에 게시합니다.",
      "모든 제출물이 그대로 노출되는 것은 아니며, 공개 여부는 관리자의 판단에 따릅니다.",
    ],
    mono: `inbox.receive(mail);
draft = curate(inbox);
vault.publish(selectedOnly);
vault.reject(rest);`,
    cta: "처음 방으로",
  },
];

const MASTER_ID = "1234";
const MASTER_PASSWORD = "1234";
const RECORD_POPUP_WIDTH = 440;
const RECORD_POPUP_HEIGHT = 340;

export default function App() {
  const [index, setIndex] = useState(0);
  const [doorsClosed, setDoorsClosed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [returnVisits, setReturnVisits] = useState(0);
  const [note, setNote] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("");
  const [loginError, setLoginError] = useState("");
  const [recordPopupOpen, setRecordPopupOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 24, y: 24 });
  const [archiveInbox, setArchiveInbox] = useState<ArchiveEntry[]>([]);
  const [publishedIds, setPublishedIds] = useState<string[]>([]);
  const [archiveNicknameQuery, setArchiveNicknameQuery] = useState("");
  const [mailFeedback, setMailFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const mailFeedbackTimerRef = useRef<number | null>(null);
  const lockRef = useRef(false);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
  });
  const room = ROOMS[index]!;
  const returnIndex = ROOMS.findIndex((item) => item.id === "return");
  const loginIndex = ROOMS.findIndex((item) => item.id === "login");
  const recordIndex = ROOMS.findIndex((item) => item.id === "record");
  const archiveIndex = ROOMS.findIndex((item) => item.id === "archive");
  const firstIndex = ROOMS.findIndex((item) => item.id === "threshold");
  const popupEnabled = returnVisits >= 2;

  const reloadArchive = useCallback(() => {
    setArchiveInbox(loadInbox());
    setPublishedIds(loadPublishedIds());
  }, []);

  useEffect(() => {
    if (room.id !== "archive") return;
    reloadArchive();
  }, [room.id, reloadArchive]);

  useEffect(() => {
    return () => {
      if (mailFeedbackTimerRef.current !== null) {
        window.clearTimeout(mailFeedbackTimerRef.current);
      }
    };
  }, []);

  const transit = useCallback((next: (current: number) => number) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setIsBusy(true);
    setDoorsClosed(true);

    window.setTimeout(() => {
      setIndex((current) => {
        const nextIndex = next(current);
        if (nextIndex === returnIndex) {
          setReturnVisits((value) => value + 1);
        }
        return nextIndex;
      });
      setDoorsClosed(false);

      window.setTimeout(() => {
        lockRef.current = false;
        setIsBusy(false);
      }, DOOR_TRANSITION_MS);
    }, DOOR_TRANSITION_MS);
  }, [returnIndex]);

  const advance = useCallback(() => {
    transit((i) => (i + 1) % ROOMS.length);
  }, [transit]);

  const goToRecord = useCallback(() => {
    transit(() => recordIndex);
  }, [recordIndex, transit]);

  const goToArchive = useCallback(() => {
    transit(() => archiveIndex);
  }, [archiveIndex, transit]);

  const goToLogin = useCallback(() => {
    transit(() => loginIndex);
  }, [loginIndex, transit]);

  const goToFirst = useCallback(() => {
    transit(() => firstIndex);
  }, [firstIndex, transit]);

  const closeRecordPopup = useCallback(() => {
    dragRef.current.active = false;
    dragRef.current.pointerId = -1;
    setRecordPopupOpen(false);
  }, []);

  const goToPage = useCallback(
    (targetIndex: number) => {
      if (isBusy || targetIndex === index) return;
      transit(() => targetIndex);
    },
    [index, isBusy, transit],
  );

  const submitLogin = useCallback(() => {
    if (!loginId.trim() || !loginPassword.trim()) {
      setLoginError("아이디와 비밀번호를 입력해 주세요.");
      return false;
    }
    if (loginId.trim() !== MASTER_ID || loginPassword.trim() !== MASTER_PASSWORD) {
      setLoginError("마스터 계정이 아닙니다. 아이디와 비밀번호를 확인해 주세요.");
      return false;
    }
    setIsLoggedIn(true);
    setLoginError("");
    return true;
  }, [loginId, loginPassword]);

  const handleLoginAndEnterRecord = useCallback(() => {
    if (!submitLogin()) return;
    transit(() => recordIndex);
  }, [recordIndex, submitLogin, transit]);

  const ensureLoggedInForShare = useCallback(() => {
    if (isLoggedIn) return true;
    transit(() => loginIndex);
    return false;
  }, [isLoggedIn, loginIndex, transit]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setLoginPassword("");
  }, []);

  const buildRecordText = useCallback(() => {
    const displayName = nickname.trim() || "익명";
    const text = note.trim() || "(기록 내용 없음)";
    return `기록자: ${displayName}\n\n${text}`;
  }, [nickname, note]);

  const showMailFeedback = useCallback((type: "success" | "error", message: string) => {
    if (mailFeedbackTimerRef.current !== null) {
      window.clearTimeout(mailFeedbackTimerRef.current);
    }
    setMailFeedback({ type, message });
    mailFeedbackTimerRef.current = window.setTimeout(() => {
      setMailFeedback(null);
      mailFeedbackTimerRef.current = null;
    }, 4500);
  }, []);

  const shareToKakao = useCallback(() => {
    if (!ensureLoggedInForShare()) return;
    const shareUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(buildRecordText())}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }, [buildRecordText, ensureLoggedInForShare]);

  const sendMailToAdmin = useCallback(() => {
    if (!ensureLoggedInForShare()) return;
    if (!note.trim()) {
      showMailFeedback("error", "관리자에게 전송에 실패했습니다. 기록 내용을 먼저 작성해 주세요.");
      return;
    }

    try {
      appendSubmission(nickname.trim() || "익명", note.trim());
      reloadArchive();
      const subject = encodeURIComponent("[기록지 공유] Yi Sang 인터랙티브 기록");
      const body = encodeURIComponent(buildRecordText());
      window.location.href = `mailto:astralanima@naver.com?subject=${subject}&body=${body}`;
      showMailFeedback(
        "success",
        "관리자에게 전송에 성공했습니다. 관리자가 확인한 뒤 선별한 글은 보관소에서 확인할 수 있습니다.",
      );
    } catch {
      showMailFeedback("error", "관리자에게 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }, [buildRecordText, ensureLoggedInForShare, nickname, note, reloadArchive, showMailFeedback]);

  const handlePublishArchive = useCallback(
    (id: string) => {
      publishEntry(id);
      reloadArchive();
    },
    [reloadArchive],
  );

  const handleUnpublishArchive = useCallback(
    (id: string) => {
      unpublishEntry(id);
      reloadArchive();
    },
    [reloadArchive],
  );

  const handleDeleteArchive = useCallback(
    (id: string) => {
      deleteEntry(id);
      reloadArchive();
    },
    [reloadArchive],
  );

  const onPopupDragStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const panel = event.currentTarget.parentElement;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPopupDragMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return;

    const panelWidth = RECORD_POPUP_WIDTH;
    const panelHeight = RECORD_POPUP_HEIGHT;
    const maxX = Math.max(12, window.innerWidth - panelWidth - 12);
    const maxY = Math.max(12, window.innerHeight - panelHeight - 12);
    const nextX = Math.min(maxX, Math.max(12, event.clientX - dragRef.current.offsetX));
    const nextY = Math.min(maxY, Math.max(12, event.clientY - dragRef.current.offsetY));
    setPopupPosition({ x: nextX, y: nextY });
  }, []);

  const onPopupDragEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current.active = false;
    dragRef.current.pointerId = -1;
  }, []);

  const isLoginRoom = room.id === "login";
  const isRecordRoom = room.id === "record";
  const isArchiveRoom = room.id === "archive";
  const hasNote = note.trim().length > 0;

  const publishedEntries = archiveInbox.filter((entry) => publishedIds.includes(entry.id));
  const filteredPublished = publishedEntries.filter((entry) => {
    const q = archiveNicknameQuery.trim().toLowerCase();
    if (!q) return true;
    return entry.nickname.toLowerCase().includes(q);
  });
  const pendingEntries = archiveInbox.filter((entry) => !publishedIds.includes(entry.id));

  return (
    <div className="app">
      <div className="grain" />

      <div className="pendulum" aria-hidden="true">
        <span className="pendulum-line" />
        <span className="pendulum-bob" />
      </div>

      <DoorPortal closed={doorsClosed} />

      {mailFeedback ? (
        <div className={`mail-toast mail-toast-${mailFeedback.type}`} role="alert" aria-live="polite">
          {mailFeedback.message}
        </div>
      ) : null}

      <main className={`stage ${popupEnabled ? "stage-expanded-foot" : ""}`}>
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
            {room.heroSrc ? (
              <div className="hero-wrap">
                <div className="hero-frame">
                  <img
                    src={room.heroSrc}
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

            {isArchiveRoom ? (
              <section className="archive-panel">
                <div className="archive-search">
                  <label className="archive-search-label" htmlFor="archive-nick-search">
                    닉네임 검색
                  </label>
                  <input
                    id="archive-nick-search"
                    className="archive-search-input"
                    type="search"
                    placeholder="닉네임 일부를 입력하세요"
                    value={archiveNicknameQuery}
                    onChange={(event) => setArchiveNicknameQuery(event.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className="archive-published">
                  <h2 className="archive-subtitle">선별 · 게시된 기록</h2>
                  {filteredPublished.length === 0 ? (
                    <p className="archive-empty">
                      {publishedEntries.length === 0
                        ? "아직 보관소에 게시된 기록이 없습니다. 관리자 선별 후 이곳에 나타납니다."
                        : "검색 조건에 맞는 기록이 없습니다."}
                    </p>
                  ) : (
                    <ul className="archive-list">
                      {filteredPublished.map((entry) => (
                        <li key={entry.id} className="archive-card">
                          <div className="archive-card-meta">
                            <span className="archive-card-name">{entry.nickname}</span>
                            <time className="archive-card-time" dateTime={new Date(entry.submittedAt).toISOString()}>
                              {new Date(entry.submittedAt).toLocaleString("ko-KR")}
                            </time>
                          </div>
                          <p className="archive-card-note">{entry.note}</p>
                          {isLoggedIn ? (
                            <div className="archive-card-actions">
                              <button
                                type="button"
                                className="record-mini-btn archive-unpublish"
                                onClick={() => handleUnpublishArchive(entry.id)}
                              >
                                게시 취소
                              </button>
                              <button
                                type="button"
                                className="record-mini-btn archive-delete"
                                onClick={() => handleDeleteArchive(entry.id)}
                              >
                                삭제
                              </button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {isLoggedIn ? (
                  <div className="archive-admin">
                    <h2 className="archive-subtitle">접수함 · 관리자 선별</h2>
                    <p className="archive-admin-note">
                      관리자 전송 버튼으로 접수된 기록이 여기에 쌓입니다. 게시할 항목만 보관소에 올리세요.
                    </p>
                    {pendingEntries.length === 0 ? (
                      <p className="archive-empty">선별 대기 중인 새 접수가 없습니다.</p>
                    ) : (
                      <ul className="archive-list admin">
                        {pendingEntries.map((entry) => (
                          <li key={entry.id} className="archive-card pending">
                            <div className="archive-card-meta">
                              <span className="archive-card-name">{entry.nickname}</span>
                              <time className="archive-card-time" dateTime={new Date(entry.submittedAt).toISOString()}>
                                {new Date(entry.submittedAt).toLocaleString("ko-KR")}
                              </time>
                            </div>
                            <p className="archive-card-note">{entry.note}</p>
                            <div className="archive-card-actions">
                              <button
                                type="button"
                                className="record-mini-btn"
                                onClick={() => handlePublishArchive(entry.id)}
                              >
                                보관소에 게시
                              </button>
                              <button
                                type="button"
                                className="record-mini-btn archive-delete"
                                onClick={() => handleDeleteArchive(entry.id)}
                              >
                                삭제
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="archive-login-hint">접수함과 선별 기능은 로그인 후 이용할 수 있습니다.</p>
                )}
              </section>
            ) : null}

            {isLoginRoom ? (
              <section className="record-sheet">
                <div className="record-auth">
                  <p className="record-label">기록을 남기려면 먼저 로그인해 주세요.</p>
                  <input
                    className="record-input-line"
                    type="text"
                    placeholder="아이디"
                    value={loginId}
                    onChange={(event) => setLoginId(event.target.value)}
                  />
                  <input
                    className="record-input-line"
                    type="password"
                    placeholder="비밀번호"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                  />
                  {loginError ? <p className="record-error">{loginError}</p> : null}
                  <button type="button" className="portal record-action" onClick={handleLoginAndEnterRecord}>
                    <span className="portal-label">로그인</span>
                    <span className="portal-hint">기록지 잠금 해제</span>
                  </button>
                </div>
              </section>
            ) : null}

            {isRecordRoom ? (
              <section className="record-sheet">
                <div className="record-inline-head">
                  <p className="record-label">떠오른 문장을 자유롭게 남겨 보세요.</p>
                  {isLoggedIn ? (
                    <button type="button" className="record-mini-btn" onClick={handleLogout}>
                      로그아웃
                    </button>
                  ) : null}
                </div>
                <input
                  className="record-input-line"
                  type="text"
                  placeholder="닉네임 (선택)"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                />
                <textarea
                  id="record-note"
                  className="record-input"
                  placeholder="이 방에서 떠오른 생각을 적어 보세요..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <p className="record-share-hint">
                  {isLoggedIn
                    ? "공유·전송이 가능합니다."
                    : "카카오톡 공유·관리자 전송은 로그인 후 이용할 수 있습니다."}
                </p>
                <div className="record-share-row">
                  {!isLoggedIn ? (
                    <button type="button" className="record-mini-btn record-login-link" onClick={goToLogin}>
                      로그인
                    </button>
                  ) : null}
                  <button type="button" className="record-mini-btn record-icon-btn" onClick={shareToKakao} disabled={!hasNote}>
                    <img src="/icon-kakao.png" alt="" className="record-btn-icon" width={18} height={18} />
                    <span>카카오톡으로 공유</span>
                  </button>
                  <button type="button" className="record-mini-btn record-icon-btn" onClick={sendMailToAdmin} disabled={!hasNote}>
                    <img src="/icon-send.png" alt="" className="record-btn-icon" width={18} height={18} />
                    <span>관리자에게 전송</span>
                  </button>
                </div>
              </section>
            ) : null}

            {room.id === "return" ? (
              <div className={`portal-row ${returnVisits >= 2 ? "dual" : ""}`}>
                {returnVisits < 2 ? (
                  <button
                    type="button"
                    className="portal"
                    onClick={goToRecord}
                    disabled={isBusy}
                  >
                    <span className="portal-arch" />
                    <span className="portal-label">다음 장으로..</span>
                    <span className="portal-hint">클릭 · 문이 열립니다</span>
                  </button>
                ) : (
                  <>
                    <button type="button" className="portal" onClick={goToRecord} disabled={isBusy}>
                      <span className="portal-arch" />
                      <span className="portal-label">기록지로..</span>
                      <span className="portal-hint">기록지 페이지로 이동</span>
                    </button>
                    <button
                      type="button"
                      className="portal"
                      onClick={goToFirst}
                      disabled={isBusy}
                    >
                      <span className="portal-arch" />
                      <span className="portal-label">처음으로 돌아가기</span>
                      <span className="portal-hint">첫 방으로 이동합니다</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="portal-row">
                <button
                  type="button"
                  className="portal"
                  onClick={
                    room.id === "record"
                      ? goToArchive
                      : room.id === "archive"
                        ? goToFirst
                        : room.id === "login"
                          ? goToRecord
                          : advance
                  }
                  disabled={isBusy}
                >
                  <span className="portal-arch" />
                  <span className="portal-label">{room.cta}</span>
                  <span className="portal-hint">클릭 · 문이 열립니다</span>
                </button>
              </div>
            )}
          </motion.article>
        </AnimatePresence>

        {popupEnabled ? (
          <>
            <button
              type="button"
              className="record-fab"
              onClick={() => setRecordPopupOpen((open) => !open)}
              disabled={isBusy}
            >
              기록지
            </button>
            {recordPopupOpen ? (
              <section
                className="record-popup"
                style={{ left: `${popupPosition.x}px`, top: `${popupPosition.y}px` }}
              >
                <div className="record-popup-head">
                  <div
                    className="record-popup-drag"
                    onPointerDown={onPopupDragStart}
                    onPointerMove={onPopupDragMove}
                    onPointerUp={onPopupDragEnd}
                    onPointerCancel={onPopupDragEnd}
                  >
                    <span>기록지 · 자유 메모</span>
                  </div>
                  <button
                    type="button"
                    className="record-popup-close"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={closeRecordPopup}
                  >
                    닫기
                  </button>
                </div>
                <textarea
                  className="record-input popup"
                  placeholder="이동 중에도 떠오른 생각을 적어 보세요..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <p className="record-popup-guide">
                  {isLoggedIn
                    ? "닫기 후에도 다른 방을 보며 이어 쓸 수 있습니다."
                    : "공유 및 전송은 로그인이 필요합니다."}
                </p>
                <div className="record-share-row popup">
                  {!isLoggedIn ? (
                    <button type="button" className="record-mini-btn record-login-link" onClick={goToLogin}>
                      로그인
                    </button>
                  ) : null}
                  <button type="button" className="record-mini-btn record-icon-btn" onClick={shareToKakao} disabled={!hasNote}>
                    <img src="/icon-kakao.png" alt="" className="record-btn-icon" width={18} height={18} />
                    <span>카카오톡으로 공유</span>
                  </button>
                  <button type="button" className="record-mini-btn record-icon-btn" onClick={sendMailToAdmin} disabled={!hasNote}>
                    <img src="/icon-send.png" alt="" className="record-btn-icon" width={18} height={18} />
                    <span>관리자에게 전송</span>
                  </button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {popupEnabled ? (
          <footer className="foot foot-with-nav">
            <div className="foot-row">
              <span className="foot-plant" aria-hidden="true" />
              <span className="foot-counter">
                {index + 1} / {ROOMS.length}
              </span>
              <span className="foot-sphere" aria-hidden="true" />
            </div>
            <div className="foot-nav">
              <label className="foot-nav-label" htmlFor="page-jump">
                이동
              </label>
              <select
                id="page-jump"
                className="foot-select"
                value={index}
                disabled={isBusy}
                onChange={(event) => goToPage(Number(event.target.value))}
              >
                {ROOMS.map((r, i) => (
                  <option key={r.id} value={i}>
                    {r.kicker} · {r.title}
                  </option>
                ))}
              </select>
            </div>
          </footer>
        ) : null}
      </main>
    </div>
  );
}
