/**
 * Reusable TUI helpers for the user-story extension.
 * Uses only patterns from pi.dev/docs/latest/tui
 */

import { Container, SelectList, Text, type SelectItem } from "@mariozechner/pi-tui";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { StoryMeta, TaskMeta } from "./fs.js";

// ─── Story picker ─────────────────────────────────────────────────────────────

export async function pickStory(
  ctx: ExtensionContext,
  stories: StoryMeta[]
): Promise<StoryMeta | null> {
  if (stories.length === 0) {
    ctx.ui.notify("No stories found in workspace.", "warning");
    return null;
  }

  const items: SelectItem[] = stories.map(s => ({
    value: s.folderName,
    label: `[${String(s.number).padStart(3, "0")}] ${s.frontmatter.name ?? s.slug}`,
    description: (s.frontmatter.description as string | undefined) ?? "",
  }));

  const choice = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
    const container = new Container();
    container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    container.addChild(new Text(theme.fg("accent", theme.bold(" 📖  Select Story")), 1, 0));

    const list = new SelectList(items, Math.min(items.length, 12), {
      selectedPrefix: (t: string) => theme.fg("accent", t),
      selectedText:   (t: string) => theme.fg("accent", t),
      description:    (t: string) => theme.fg("muted", t),
      scrollInfo:     (t: string) => theme.fg("dim", t),
      noMatch:        (t: string) => theme.fg("warning", t),
    });
    list.onSelect = (item) => done(item.value);
    list.onCancel = () => done(null);
    container.addChild(list);

    container.addChild(new Text(theme.fg("dim", " ↑↓ navigate  enter select  esc cancel"), 1, 0));
    container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

    return {
      render: (w: number) => container.render(w),
      invalidate: () => container.invalidate(),
      handleInput: (data: string) => { list.handleInput(data); tui.requestRender(); },
    };
  });

  if (!choice) return null;
  return stories.find(s => s.folderName === choice) ?? null;
}

// ─── Task picker ─────────────────────────────────────────────────────────────

export async function pickTask(
  ctx: ExtensionContext,
  tasks: TaskMeta[],
  storyName: string
): Promise<TaskMeta | null> {
  if (tasks.length === 0) {
    ctx.ui.notify(`No tasks found in story "${storyName}".`, "warning");
    return null;
  }

  const items: SelectItem[] = tasks.map(t => ({
    value: t.fileName,
    label: `${t.done ? "✓" : "○"} [${String(t.number).padStart(3, "0")}] ${t.frontmatter.name ?? t.slug}`,
    description: (t.frontmatter.description as string | undefined) ?? "",
  }));

  const choice = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
    const container = new Container();
    container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    container.addChild(
      new Text(theme.fg("accent", theme.bold(` 📋  Tasks — ${storyName}`)), 1, 0)
    );

    const list = new SelectList(items, Math.min(items.length, 14), {
      selectedPrefix: (t: string) => theme.fg("accent", t),
      selectedText:   (t: string) => theme.fg("accent", t),
      description:    (t: string) => theme.fg("muted", t),
      scrollInfo:     (t: string) => theme.fg("dim", t),
      noMatch:        (t: string) => theme.fg("warning", t),
    });
    list.onSelect = (item) => done(item.value);
    list.onCancel = () => done(null);
    container.addChild(list);

    container.addChild(new Text(theme.fg("dim", " ✓ done  ○ pending  ↑↓ navigate  enter select  esc cancel"), 1, 0));
    container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

    return {
      render: (w: number) => container.render(w),
      invalidate: () => container.invalidate(),
      handleInput: (data: string) => { list.handleInput(data); tui.requestRender(); },
    };
  });

  if (!choice) return null;
  return tasks.find(t => t.fileName === choice) ?? null;
}

// ─── Footer renderer ──────────────────────────────────────────────────────────

export function buildFooterText(
  theme: { fg: (color: string, text: string) => string; bold: (text: string) => string },
  story: StoryMeta | null
): string {
  if (!story) {
    return theme.fg("dim", "no story selected  /story-open to pick one");
  }
  const name = (story.frontmatter.name as string | undefined) ?? story.slug;
  const num  = String(story.number).padStart(3, "0");
  return (
    theme.fg("accent", "◆ ") +
    theme.fg("accent", theme.bold(name)) +
    theme.fg("muted", `  [${num}]`)
  );
}
