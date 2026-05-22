"use client";

import { useCallback, useMemo, useState } from "react";
import DailyReportView from "./DailyReportView.js";
import BaljuanaraView from "./BaljuanaraView.js";
import ServerView from "./ServerView.js";
import {
  IconChevronDown,
  IconShirt,
  IconServer,
  IconSettings,
  IconUser,
} from "./icons.js";

const DAILY_REPORT_TAB_ID = "daily-report";
const IDC_TAB_ID = "idc";
const BALJUANARA_TAB_ID = "baljuanara";

function getMenuTabs(item) {
  return item.tabs ?? (item.tab ? [item.tab] : []);
}

function renderTabContent(tabId) {
  switch (tabId) {
    case DAILY_REPORT_TAB_ID:
      return <DailyReportView />;
    case IDC_TAB_ID:
      return <ServerView />;
    case BALJUANARA_TAB_ID:
      return <BaljuanaraView />;
    default:
      return null;
  }
}

/** 좌측 메뉴 정의 */
export function createMenuItems() {
  return [
    {
      id: "personal",
      label: "개인",
      icon: <IconUser />,
      tabs: [{ id: DAILY_REPORT_TAB_ID, label: "일일 보고" }],
    },
    {
      id: "server",
      label: "서버",
      icon: <IconServer />,
      tabs: [{ id: IDC_TAB_ID, label: "IDC 점검" }],
    },
    {
      id: "baljuanara",
      label: "발주나라",
      icon: <IconShirt />,
      tabs: [{ id: BALJUANARA_TAB_ID, label: "운영 배포" }],
    },
  ];
}

export const MENU_ITEMS = createMenuItems();

export const INITIAL_TABS = [];

export default function AppShell({
  menuItems = MENU_ITEMS,
  initialTabs = INITIAL_TABS,
}) {
  const [tabs, setTabs] = useState(initialTabs);
  const [activeTabId, setActiveTabId] = useState(
    () => initialTabs[0]?.id ?? null,
  );
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [expandedMenuIds, setExpandedMenuIds] = useState([]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const activateMenu = useCallback((item, tabIdToKeep) => {
    const menuTabs = getMenuTabs(item);
    setActiveMenuId(item.id);
    setTabs(menuTabs);
    if (tabIdToKeep === undefined) {
      setActiveTabId((prev) =>
        menuTabs.some((tab) => tab.id === prev) ? prev : null,
      );
    } else {
      setActiveTabId(tabIdToKeep);
    }
  }, []);

  const handleMenuClick = useCallback(
    (item) => {
      activateMenu(item);
    },
    [activateMenu],
  );

  const handleTabSelect = useCallback(
    (item, tab) => {
      activateMenu(item, tab.id);
    },
    [activateMenu],
  );

  const toggleMenuExpand = useCallback((item) => {
    const menuTabs = getMenuTabs(item);
    setExpandedMenuIds((prev) => {
      const willExpand = !prev.includes(item.id);
      if (willExpand) {
        setActiveMenuId(item.id);
        setTabs(menuTabs);
        setActiveTabId((tid) =>
          menuTabs.some((tab) => tab.id === tid) ? tid : null,
        );
        return [...prev, item.id];
      }
      return prev.filter((id) => id !== item.id);
    });
  }, []);

  const goToMain = useCallback(() => {
    setTabs(initialTabs);
    setActiveTabId(initialTabs[0]?.id ?? null);
    setActiveMenuId(null);
    setExpandedMenuIds([]);
  }, [initialTabs]);

  const menuList = useMemo(() => menuItems, [menuItems]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <button
            type="button"
            className="sidebar__logo-btn"
            onClick={goToMain}
            aria-label="메인 화면"
          >
            <span className="sidebar__logo" aria-hidden="true" />
          </button>
          <div className="sidebar__brand-text">
            <span className="sidebar__app-name">KABEAD</span>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          <ul className="sidebar__menu">
            {menuList.map((item) => {
              const isActive = item.id === activeMenuId;
              const isExpanded = expandedMenuIds.includes(item.id);
              const menuTabs = getMenuTabs(item);

              return (
                <li
                  key={item.id}
                  className={`sidebar__menu-group${isActive ? " is-active" : ""}${isExpanded ? " is-expanded" : ""}`}
                >
                  <div className="sidebar__menu-row">
                    <button
                      type="button"
                      className="sidebar__menu-item"
                      onClick={() => handleMenuClick(item)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        if (menuTabs.length > 0) {
                          toggleMenuExpand(item);
                        }
                      }}
                    >
                      {item.icon ? (
                        <span className="sidebar__menu-icon">{item.icon}</span>
                      ) : null}
                      <span className="sidebar__menu-label">{item.label}</span>
                    </button>
                    {menuTabs.length > 0 ? (
                      <button
                        type="button"
                        className="sidebar__menu-expand"
                        onClick={() => toggleMenuExpand(item)}
                        aria-expanded={isExpanded}
                        aria-label={`${item.label} 탭 목록`}
                      >
                        <IconChevronDown />
                      </button>
                    ) : null}
                  </div>
                  {isExpanded && menuTabs.length > 0 ? (
                    <ul className="sidebar__submenu">
                      {menuTabs.map((tab) => {
                        const isTabActive =
                          isActive && tab.id === activeTabId;
                        return (
                          <li key={tab.id}>
                            <button
                              type="button"
                              className={`sidebar__submenu-item${isTabActive ? " is-active" : ""}`}
                              onClick={() => handleTabSelect(item, tab)}
                            >
                              {tab.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <button type="button" className="sidebar__footer-btn" aria-label="Settings">
            <IconSettings />
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="workspace-header">
          <div className="workspace-header__top workspace-header__top--profile-only">
            <div className="workspace-header__actions">
              <div className="workspace-header__profile">
                <span className="workspace-header__name">권성윤</span>
              </div>
            </div>
          </div>
        </header>

        <section
          className="workspace-content"
          role="tabpanel"
          aria-label={activeTab?.label ?? "Content"}
        >
          {activeTabId ? renderTabContent(activeTabId) : null}
        </section>
      </div>
    </div>
  );
}
