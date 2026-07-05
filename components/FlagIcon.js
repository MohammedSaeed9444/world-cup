import Image from "next/image";
import { getFlagSrc, getFlagEmoji } from "@/utils/flags";

/**
 * Renders a team's flag — SVG image when available, emoji fallback otherwise.
 *
 * @param {{ team: string, size?: number, className?: string }} props
 *   size — height in pixels (width is auto 4:3 aspect). Default 32.
 */
export default function FlagIcon({ team, size = 32, className = "" }) {
  const src = getFlagSrc(team);

  if (src) {
    return (
      <span className={`inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm ${className}`}>
        <Image
          src={src}
          alt={`${team} flag`}
          width={Math.round(size * 1.333)}
          height={size}
          className="object-cover"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-block leading-none ${className}`}
      style={{ fontSize: size * 0.85 }}
      role="img"
      aria-label={`${team} flag`}
    >
      {getFlagEmoji(team)}
    </span>
  );
}
