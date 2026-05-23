"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CARD_COLUMN_KEYS = ["name", "project", "due", "note", "done", "review"];

function dueStartSortValue(row) {
  const due = row.values?.due;
  if (!due || typeof due !== "object" || !due.start) {
    return "9999/12/31";
  }

  return due.start;
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const dueCompare = dueStartSortValue(a).localeCompare(dueStartSortValue(b));
    if (dueCompare !== 0) return dueCompare;

    return String(a.values?.name ?? "").localeCompare(
      String(b.values?.name ?? ""),
      "ko",
    );
  });
}

function groupRowsByPara(rows) {
  const order = ["Project", "Area"];
  const groups = new Map(order.map((name) => [name, []]));

  for (const row of rows) {
    const groupName = row.group;
    if (!order.includes(groupName)) continue;
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(row);
  }

  return [...groups.entries()]
    .map(([name, rowsInGroup]) => ({ name, rows: sortRows(rowsInGroup) }))
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

function updateGroups(groups, updatedRow) {
  const rows = groups
    .flatMap((group) => group.rows)
    .map((row) => (row.id === updatedRow.id ? updatedRow : row));

  return groupRowsByPara(rows);
}

function addRowToGroups(groups, newRow) {
  return groupRowsByPara([...groups.flatMap((group) => group.rows), newRow]);
}

function removeRowFromGroups(groups, rowId) {
  return groupRowsByPara(
    groups.flatMap((group) => group.rows).filter((row) => row.id !== rowId),
  );
}

function moveRowToGroup(groups, rowId, targetGroup) {
  const rows = groups.flatMap((group) => group.rows);

  return groupRowsByPara(
    rows.map((row) =>
      row.id === rowId
        ? {
            ...row,
            group: targetGroup,
            values: {
              ...row.values,
              para: targetGroup,
            },
          }
        : row,
    ),
  );
}

function countRows(groups) {
  return groups.reduce((sum, group) => sum + group.rows.length, 0);
}

function cloneValue(value) {
  if (value && typeof value === "object") {
    return { ...value };
  }

  return value;
}

function cloneValues(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, cloneValue(value)]),
  );
}

function createDrafts(groups) {
  return Object.fromEntries(
    groups
      .flatMap((group) => group.rows)
      .map((row) => [row.id, cloneValues(row.values)]),
  );
}

function valueForInput(value) {
  return value == null ? "" : value;
}

function valueForDateRange(value) {
  if (value && typeof value === "object") {
    return {
      start: value.start ?? "",
      end: value.end ?? "",
    };
  }

  return { start: "", end: "" };
}

function dateDisplayToInput(value) {
  return value ? value.replaceAll("/", "-") : "";
}

function dateInputToDisplay(value) {
  return value ? value.replaceAll("-", "/") : "";
}

function comparableValue(value) {
  if (value && typeof value === "object") {
    return valueForDateRange(value);
  }

  return value == null ? "" : value;
}

function valuesAreEqual(a, b) {
  return JSON.stringify(comparableValue(a)) === JSON.stringify(comparableValue(b));
}

function findRowById(groups, rowId) {
  return groups.flatMap((group) => group.rows).find((row) => row.id === rowId);
}

function DatePickerField({ value, disabled, saving, onChange, onCommit }) {
  const pickerRef = useRef(null);

  const openPicker = () => {
    if (disabled || saving) return;
    if (typeof pickerRef.current?.showPicker === "function") {
      pickerRef.current.showPicker();
    } else {
      pickerRef.current?.focus();
    }
  };

  return (
    <div className="notion-table__date-field">
      <input
        className="notion-table__field notion-table__field--date"
        type="text"
        inputMode="numeric"
        placeholder="yyyy/mm/dd"
        value={value}
        disabled={disabled || saving}
        onClick={openPicker}
        onFocus={openPicker}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onCommit(event.target.value)}
      />
      <button
        type="button"
        className="notion-table__date-picker"
        disabled={disabled || saving}
        aria-label="날짜 선택"
        onMouseDown={(event) => event.preventDefault()}
        onClick={openPicker}
      >
        선택
      </button>
      <input
        ref={pickerRef}
        className="notion-table__date-native"
        type="date"
        tabIndex={-1}
        value={dateDisplayToInput(value)}
        onChange={(event) => {
          const nextValue = dateInputToDisplay(event.target.value);
          onChange(nextValue);
          onCommit(nextValue);
        }}
      />
    </div>
  );
}

function EditableCell({
  column,
  row,
  value,
  saving,
  onDraftChange,
  onCommit,
  onWorkflow,
}) {
  if (column.control === "button") {
    return (
      <button
        type="button"
        className="notion-table__action"
        disabled={!column.editable || saving}
        onClick={() => onWorkflow(row.id, column.key)}
      >
        {saving ? "처리 중" : column.label}
      </button>
    );
  }

  if (!column.propertyName) {
    return <span className="notion-table__missing">속성 없음</span>;
  }

  if (column.control === "select") {
    return (
      <select
        className="notion-table__field"
        value={valueForInput(value)}
        disabled={!column.editable || saving}
        onChange={(event) => onDraftChange(row.id, column.key, event.target.value)}
        onBlur={() => onCommit(row.id, column.key, value)}
      >
        <option value="">-</option>
        {column.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (column.control === "dateRange") {
    const dateRange = valueForDateRange(value);

    return (
      <div className="notion-table__date-range">
        <DatePickerField
          value={dateRange.start}
          disabled={!column.editable || saving}
          saving={saving}
          onChange={(nextValue) =>
            onDraftChange(row.id, column.key, {
              ...dateRange,
              start: nextValue,
            })
          }
          onCommit={(nextValue) =>
            onCommit(row.id, column.key, {
              ...dateRange,
              start: nextValue,
            })
          }
        />
        <span className="notion-table__date-separator">~</span>
        <DatePickerField
          value={dateRange.end}
          disabled={!column.editable || saving}
          saving={saving}
          onChange={(nextValue) =>
            onDraftChange(row.id, column.key, {
              ...dateRange,
              end: nextValue,
            })
          }
          onCommit={(nextValue) =>
            onCommit(row.id, column.key, {
              ...dateRange,
              end: nextValue,
            })
          }
        />
      </div>
    );
  }

  if (column.control === "checkbox") {
    return (
      <input
        className="notion-table__checkbox"
        type="checkbox"
        checked={Boolean(value)}
        disabled={!column.editable || saving}
        onChange={(event) => {
          onDraftChange(row.id, column.key, event.target.checked);
          onCommit(row.id, column.key, event.target.checked);
        }}
      />
    );
  }

  if (column.control === "textarea") {
    return (
      <textarea
        className="notion-table__field notion-table__field--textarea"
        value={valueForInput(value)}
        disabled={!column.editable || saving}
        rows={Math.max(2, valueForInput(value).split("\n").length)}
        onChange={(event) => onDraftChange(row.id, column.key, event.target.value)}
        onBlur={(event) => onCommit(row.id, column.key, event.target.value)}
      />
    );
  }

  return (
    <input
      className="notion-table__field notion-table__field--text"
      type="text"
      value={valueForInput(value)}
      disabled={!column.editable || saving}
      onChange={(event) => onDraftChange(row.id, column.key, event.target.value)}
      onBlur={(event) => onCommit(row.id, column.key, event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function NotionCard({
  columns,
  row,
  values,
  saving,
  dragging,
  onDraftChange,
  onCommit,
  onWorkflow,
  onDelete,
  onDragStart,
  onDragEnd,
}) {
  const cardColumns = CARD_COLUMN_KEYS.map((key) =>
    columns.find((column) => column.key === key),
  ).filter(Boolean);
  const fieldColumns = cardColumns.filter(
    (column) => column.control !== "button",
  );
  const actionColumns = cardColumns.filter((column) => column.control === "button");

  return (
    <article
      className={`notion-card${dragging ? " is-dragging" : ""}`}
      draggable
      onDragStart={(event) => onDragStart(event, row.id)}
      onDragEnd={onDragEnd}
    >
      <div className="notion-card__drag-handle">드래그해서 이동</div>
      <div className="notion-card__fields">
        {fieldColumns.map((column) => (
          <label
            className={`notion-card__field notion-card__field--${column.key}`}
            key={column.key}
          >
            <span className="notion-card__label">{column.label}</span>
            <EditableCell
              column={column}
              row={row}
              value={values[column.key]}
              saving={saving}
              onDraftChange={onDraftChange}
              onCommit={onCommit}
              onWorkflow={onWorkflow}
            />
          </label>
        ))}
      </div>
      <div className="notion-card__actions">
        {actionColumns.map((column) => (
          <EditableCell
            column={column}
            key={column.key}
            row={row}
            value={values[column.key]}
            saving={saving}
            onDraftChange={onDraftChange}
            onCommit={onCommit}
            onWorkflow={onWorkflow}
          />
        ))}
        <button
          type="button"
          className="notion-table__action notion-table__action--danger"
          disabled={saving}
          onClick={() => onDelete(row.id)}
        >
          {saving ? "처리 중" : "삭제"}
        </button>
      </div>
    </article>
  );
}

export default function NotionView() {
  const [columns, setColumns] = useState([]);
  const [groups, setGroups] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingRowIds, setSavingRowIds] = useState([]);
  const [draggingRowId, setDraggingRowId] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notion-table");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "노션 데이터를 불러오지 못했습니다.");
      }
      const nextGroups = groupRowsByPara(
        (json.groups ?? []).flatMap((group) => group.rows),
      );
      setColumns(json.columns ?? []);
      setGroups(nextGroups);
      setDrafts(createDrafts(nextGroups));
      setTotal(json.total ?? 0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "노션 데이터를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const applyUpdatedRow = useCallback((updatedRow) => {
    setGroups((prev) => {
      const nextGroups = updateGroups(prev, updatedRow);
      setTotal(countRows(nextGroups));
      setDrafts(createDrafts(nextGroups));
      return nextGroups;
    });
  }, []);

  const applyAddedRow = useCallback((newRow) => {
    setGroups((prev) => {
      const nextGroups = addRowToGroups(prev, newRow);
      setTotal(countRows(nextGroups));
      setDrafts(createDrafts(nextGroups));
      return nextGroups;
    });
  }, []);

  const applyDeletedRow = useCallback((rowId) => {
    setGroups((prev) => {
      const nextGroups = removeRowFromGroups(prev, rowId);
      setTotal(countRows(nextGroups));
      setDrafts(createDrafts(nextGroups));
      return nextGroups;
    });
  }, []);

  const handleDraftChange = useCallback((pageId, columnKey, value) => {
    setDrafts((prev) => ({
      ...prev,
      [pageId]: {
        ...(prev[pageId] ?? {}),
        [columnKey]: value,
      },
    }));
  }, []);

  const handleAdd = useCallback(async () => {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/notion-table", {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "노션 데이터를 추가하지 못했습니다.");
      }

      applyAddedRow(json.row);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "노션 데이터를 추가하지 못했습니다.";
      setError(message);
    } finally {
      setAdding(false);
    }
  }, [applyAddedRow]);

  const handleDragStart = useCallback((event, rowId) => {
    setDraggingRowId(rowId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", rowId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingRowId(null);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handlePatch = useCallback(async (pageId, columnKey, value, action) => {
    setError(null);
    setSavingRowIds((prev) => [...prev, pageId]);
    try {
      const res = await fetch("/api/notion-table", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, columnKey, value, action }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "노션 데이터를 수정하지 못했습니다.");
      }

      applyUpdatedRow(json.row);
    } finally {
      setSavingRowIds((prev) => prev.filter((id) => id !== pageId));
    }
  }, [applyUpdatedRow]);

  const handleCommit = useCallback(
    async (pageId, columnKey, value) => {
      const savedValue = findRowById(groups, pageId)?.values?.[columnKey];
      if (valuesAreEqual(savedValue, value)) {
        return;
      }

      try {
        await handlePatch(pageId, columnKey, value);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "노션 데이터를 수정하지 못했습니다.";
        setError(message);
      }
    },
    [groups, handlePatch],
  );

  const handleWorkflow = useCallback(
    async (pageId, columnKey) => {
      try {
        await handlePatch(pageId, columnKey, true, "button");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "노션 데이터를 수정하지 못했습니다.";
        setError(message);
      }
    },
    [handlePatch],
  );

  const handleDelete = useCallback(
    async (pageId) => {
      setError(null);
      setSavingRowIds((prev) => [...prev, pageId]);
      try {
        const res = await fetch("/api/notion-table", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId }),
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? "노션 데이터를 삭제하지 못했습니다.");
        }

        applyDeletedRow(pageId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "노션 데이터를 삭제하지 못했습니다.";
        setError(message);
      } finally {
        setSavingRowIds((prev) => prev.filter((id) => id !== pageId));
      }
    },
    [applyDeletedRow],
  );

  const handleDrop = useCallback(
    (event, targetGroup) => {
      event.preventDefault();
      const rowId = draggingRowId ?? event.dataTransfer.getData("text/plain");
      if (!rowId) return;

      const currentGroup = findRowById(groups, rowId)?.group;
      if (currentGroup === targetGroup) {
        setDraggingRowId(null);
        return;
      }

      setGroups((prev) => moveRowToGroup(prev, rowId, targetGroup));
      setDrafts((prev) => ({
        ...prev,
        [rowId]: {
          ...(prev[rowId] ?? {}),
          para: targetGroup,
        },
      }));
      setDraggingRowId(null);
      handleCommit(rowId, "para", targetGroup);
    },
    [draggingRowId, groups, handleCommit],
  );

  return (
    <div className="page-view">
      <header className="page-view__header notion-view__header">
        <div />
        <div className="notion-view__actions">
          <button
            type="button"
            className="notion-view__button"
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? "추가 중" : "추가"}
          </button>
          <button
            type="button"
            className="notion-view__button"
            onClick={loadRows}
            disabled={loading}
          >
            {loading ? "불러오는 중" : "새로고침"}
          </button>
        </div>
      </header>
      <div className="page-view__body">
        {error ? (
          <p className="notion-view__error" role="alert">
            {error}
          </p>
        ) : null}
        {loading && groups.length === 0 ? (
          <p className="notion-view__status">노션 데이터를 불러오는 중입니다.</p>
        ) : null}
        {!loading && groups.length === 0 && !error ? (
          <p className="notion-view__status">표시할 노션 데이터가 없습니다.</p>
        ) : null}
        <div className="notion-board">
          {groups.map((group) => (
            <section
              className={`notion-board__group${draggingRowId ? " is-drop-ready" : ""}`}
              key={group.name}
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, group.name)}
            >
              <header className="notion-board__group-header">
                <h2 className="notion-board__group-title">{group.name}</h2>
                <span className="notion-board__count">{group.rows.length}</span>
              </header>
              <div className="notion-board__cards">
                {group.rows.map((row) => (
                  <NotionCard
                    columns={columns}
                    key={row.id}
                    row={row}
                    values={drafts[row.id] ?? row.values}
                    saving={savingRowIds.includes(row.id)}
                    dragging={draggingRowId === row.id}
                    onDraftChange={handleDraftChange}
                    onCommit={handleCommit}
                    onWorkflow={handleWorkflow}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
