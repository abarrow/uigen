import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallLabel } from "../ToolCallLabel";

afterEach(() => {
  cleanup();
});

test("str_replace_editor create command shows 'Created' when complete", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Created /App.jsx")).toBeDefined();
});

test("str_replace_editor create command shows 'Creating' when in progress", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("str_replace_editor str_replace command shows 'Edited' when complete", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/Button.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Edited /Button.tsx")).toBeDefined();
});

test("str_replace_editor str_replace command shows 'Editing' when in progress", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/Button.tsx" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Editing /Button.tsx")).toBeDefined();
});

test("str_replace_editor insert command shows 'Edited' when complete", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/utils.ts" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Edited /utils.ts")).toBeDefined();
});

test("str_replace_editor insert command shows 'Editing' when in progress", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/utils.ts" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Editing /utils.ts")).toBeDefined();
});

test("str_replace_editor view command shows 'Read' when complete", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "view", path: "/App.jsx" },
        state: "result",
        result: "file contents",
      }}
    />
  );
  expect(screen.getByText("Read /App.jsx")).toBeDefined();
});

test("str_replace_editor view command shows 'Reading' when in progress", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "view", path: "/App.jsx" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Reading /App.jsx")).toBeDefined();
});

test("file_manager rename shows both paths when complete", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "file_manager",
        args: { command: "rename", path: "/old.tsx", new_path: "/new.tsx" },
        state: "result",
        result: { success: true },
      }}
    />
  );
  expect(screen.getByText("Renamed /old.tsx to /new.tsx")).toBeDefined();
});

test("file_manager rename shows 'Renaming' when in progress", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "file_manager",
        args: { command: "rename", path: "/old.tsx", new_path: "/new.tsx" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Renaming /old.tsx")).toBeDefined();
});

test("file_manager delete shows 'Deleted' when complete", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "file_manager",
        args: { command: "delete", path: "/temp.ts" },
        state: "result",
        result: { success: true },
      }}
    />
  );
  expect(screen.getByText("Deleted /temp.ts")).toBeDefined();
});

test("file_manager delete shows 'Deleting' when in progress", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "file_manager",
        args: { command: "delete", path: "/temp.ts" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Deleting /temp.ts")).toBeDefined();
});

test("unknown tool name falls back to displaying toolName", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "some_other_tool",
        args: {},
        state: "call",
      }}
    />
  );
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

test("str_replace_editor without path shows just the verb", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Creating")).toBeDefined();
});

test("shows green dot when complete", () => {
  const { container } = render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("shows spinner when in progress", () => {
  const { container } = render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});
