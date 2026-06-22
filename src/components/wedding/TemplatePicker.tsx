"use client";

import { Check } from "lucide-react";
import type { InvitationTemplate } from "@/types/api";

// Static visual config keyed by slug (colors/palette/description not stored in DB)
const VISUAL: Record<string, {
  bg: string;
  border: string;
  labelColor: string;
  labelBg: string;
  nameColor: string;
  descColor: string;
  palette: string[];
  description: string;
}> = {
  "royal-khmer-v1": {
    bg: "#1f100a",
    border: "#C9A84C",
    labelColor: "#C9A84C",
    labelBg: "rgba(201,168,76,0.12)",
    nameColor: "#FAF6EF",
    descColor: "#a8a29e",
    palette: ["#C9A84C", "#FAF6EF", "#2C1810"],
    description: "Dark luxury. Gold shimmer, floating particles, cinematic reveals.",
  },
  "angkor-heritage-v1": {
    bg: "#FFF8E8",
    border: "#D4A020",
    labelColor: "#92400e",
    labelBg: "#fef3c7",
    nameColor: "#1c1917",
    descColor: "#78716c",
    palette: ["#D4A020", "#FFF3D0", "#5C3A00"],
    description: "Angkor Wat illustration. Warm golden palette, falling petals.",
  },
  "blue-botanical-v1": {
    bg: "#ffffff",
    border: "#6A8CB2",
    labelColor: "#1d4ed8",
    labelBg: "#eff6ff",
    nameColor: "#1c1917",
    descColor: "#78716c",
    palette: ["#2C3E56", "#6A8CB2", "#BEA56E"],
    description: "Watercolor leaves. White clean design, gold ring, elegant serif.",
  },
  "phanaroth-luxury-v1": {
    bg: "#4A0404",
    border: "#E8C97A",
    labelColor: "#E8C97A",
    labelBg: "rgba(232,201,122,0.12)",
    nameColor: "#FAF6EF",
    descColor: "#f9a8a8",
    palette: ["#5C030C", "#E8C97A", "#FAF6EF"],
    description: "Royal crimson. Sliding gates, falling rose petals, live wishes scroll.",
  },
  "butterfly-editorial-v1": {
    bg: "#FCFBF9",
    border: "#C5A059",
    labelColor: "#C5A059",
    labelBg: "rgba(197,160,89,0.10)",
    nameColor: "#1c1917",
    descColor: "#78716c",
    palette: ["#5A121D", "#F5E6E3", "#C5A059"],
    description: "Luxury editorial. 3D butterflies, opening burgundy envelope, elegant scripts.",
  },
  "emerald-elegance-v1": {
    bg: "#0d1f0d",
    border: "#c9a84c",
    labelColor: "#c9a84c",
    labelBg: "rgba(201,168,76,0.10)",
    nameColor: "#f5f0e8",
    descColor: "#a8a29e",
    palette: ["#1a2818", "#c9a84c", "#f5f0e8"],
    description: "Deep forest green. Botanical line art, gold accents, smooth parallax.",
  },
};

interface TemplatePickerProps {
  templates: InvitationTemplate[];
  value: string; // selected template id (as string)
  onChange: (id: string) => void;
}

export function TemplatePicker({ templates, value, onChange }: TemplatePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* No template option */}
      <button
        type="button"
        onClick={() => onChange("")}
        className="relative flex flex-col justify-between gap-2 rounded-xl border-2 p-4 text-left transition-all"
        style={{
          background: "#f9f9f9",
          borderColor: value === "" ? "#6366f1" : "#e5e7eb",
        }}
      >
        {value === "" && (
          <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
            <Check className="h-3 w-3 text-white" />
          </span>
        )}
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">None</span>
          <p className="mt-1 text-xs text-zinc-400">No template assigned</p>
        </div>
      </button>

      {templates.map((tpl) => {
        const v = VISUAL[tpl.slug] ?? {
          bg: "#ffffff",
          border: "#d1d5db",
          labelColor: "#374151",
          labelBg: "#f3f4f6",
          nameColor: "#111827",
          descColor: "#6b7280",
          palette: ["#9ca3af"],
          description: "",
        };
        const isSelected = value === String(tpl.id);

        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onChange(String(tpl.id))}
            className="relative flex flex-col justify-between gap-3 rounded-xl border-2 p-4 text-left transition-all hover:opacity-90"
            style={{
              background: v.bg,
              borderColor: isSelected ? v.border : `${v.border}40`,
              boxShadow: isSelected ? `0 0 0 2px ${v.border}55` : undefined,
            }}
          >
            {isSelected && (
              <span
                className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ background: v.border }}
              >
                <Check className="h-3 w-3" style={{ color: v.bg }} />
              </span>
            )}

            <div className="space-y-2">
              {/* Label badge */}
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border"
                style={{
                  color: v.labelColor,
                  background: v.labelBg,
                  borderColor: `${v.labelColor}40`,
                }}
              >
                {tpl.name}
              </span>

              {/* Palette swatches */}
              <div className="flex gap-1.5">
                {v.palette.map((color) => (
                  <span
                    key={color}
                    className="h-3.5 w-3.5 rounded-full border border-white/20"
                    style={{ background: color }}
                  />
                ))}
              </div>

              {/* Description */}
              <p className="text-[11px] leading-relaxed" style={{ color: v.descColor }}>
                {v.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
