"use client";

import { useState, type FormEvent } from "react";

type AddTaskFormProps = {
  submitting: boolean;
  onSubmit: (title: string) => Promise<boolean>;
};

export function AddTaskForm({ submitting, onSubmit }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const trimmedTitle = title.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedTitle || submitting) {
      return;
    }

    // Keep the text on failure so the user can retry without retyping.
    if (await onSubmit(trimmedTitle)) {
      setTitle("");
    }
  };

  return (
    <form className="card add-task" onSubmit={handleSubmit}>
      <label htmlFor="new-task-title" className="visually-hidden">
        New task title
      </label>
      <input
        id="new-task-title"
        className="input"
        placeholder="What needs to be done?"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={200}
        autoComplete="off"
      />
      <button type="submit" className="button button--primary" disabled={!trimmedTitle || submitting}>
        {submitting ? "Adding…" : "Add task"}
      </button>
    </form>
  );
}
