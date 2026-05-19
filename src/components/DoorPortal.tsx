import { motion } from "framer-motion";

const DOOR_MS = 0.88;
const EASE = [0.65, 0, 0.35, 1] as const;

type DoorPortalProps = {
  closed: boolean;
};

export function DoorPortal({ closed }: DoorPortalProps) {
  return (
    <div
      className="door-root"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        pointerEvents: "none",
      }}
    >
      <motion.div
        className="door door-left"
        initial={false}
        animate={{ x: closed ? 0 : "-50vw" }}
        transition={{ duration: DOOR_MS, ease: EASE }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "50vw",
          height: "100%",
          background:
            "linear-gradient(105deg, #0a0a0a 0%, #1c1c1c 45%, #0f0f0f 100%)",
          boxShadow: "inset -18px 0 48px rgba(0,0,0,0.65)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      />
      <motion.div
        className="door door-right"
        initial={false}
        animate={{ x: closed ? 0 : "50vw" }}
        transition={{ duration: DOOR_MS, ease: EASE }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "50vw",
          height: "100%",
          background:
            "linear-gradient(-105deg, #0a0a0a 0%, #1c1c1c 45%, #0f0f0f 100%)",
          boxShadow: "inset 18px 0 48px rgba(0,0,0,0.65)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 2,
          height: "100%",
          transform: "translateX(-1px)",
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent)",
          opacity: closed ? 1 : 0,
          transition: `opacity ${DOOR_MS * 0.6}s ease`,
        }}
      />
    </div>
  );
}

export const DOOR_TRANSITION_MS = Math.round(DOOR_MS * 1000);
