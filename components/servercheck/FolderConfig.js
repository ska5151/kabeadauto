"use client";

import { DEFAULT_BASE_PATH, FOLDER_ROWS } from "../../lib/servercheck/constants.js";

export default function FolderConfig({ paths, onChange }) {
  const updatePath = (key, value) => {
    onChange({ ...paths, [key]: value });
  };

  const pickFolder = async (key) => {
    try {
      const res = await fetch("/api/servercheck/pick-folder");
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }
      if (data.cancelled || !data.path) return;
      updatePath(key, data.path);
    } catch {
      alert("폴더 선택에 실패했습니다.");
    }
  };

  return (
    <section className="servercheck__panel">
      <h2 className="servercheck__panel-title">폴더 설정</h2>
      <p className="servercheck__panel-desc">
        각 행에 대응하는 폴더 경로를 지정하세요. 설정은 브라우저에 저장되며
        다시 열어도 유지됩니다.
      </p>
      <div className="servercheck__folder-list">
        {FOLDER_ROWS.map((key) => (
          <div key={key} className="servercheck__folder-row">
            <label className="servercheck__folder-key" htmlFor={`folder-${key}`}>
              {key}
            </label>
            <input
              id={`folder-${key}`}
              type="text"
              value={paths[key] ?? ""}
              onChange={(e) => updatePath(key, e.target.value)}
              placeholder={`${DEFAULT_BASE_PATH}\\${key}`}
              className="servercheck__input"
            />
            <button
              type="button"
              onClick={() => pickFolder(key)}
              className="servercheck__btn"
            >
              선택
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
