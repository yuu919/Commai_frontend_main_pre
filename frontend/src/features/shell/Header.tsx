import React from "react";
import { useSetChatModel, useChatModel } from "@/features/chat/context/ChatModelContext";
import HeaderShareMenu from "./HeaderShareMenu";
import { AppHeader } from "@ui";
import MutedText from "@ui/MutedText";
import Chip from "@ui/Chip";
import Button from "@ui/Button";

export type HeaderProps = {
  title?: string;
  isSidebarCollapsed?: boolean;
  setIsSidebarCollapsed?: (v: boolean) => void;
  onModelChange?: (model: string) => void;
  projectName?: string;
  chatTitle?: string;
  onProjectNameClick?: () => void;
  onChatTitleClick?: () => void;
  availableModels?: string[];
  chatId?: string;
  hasSharedLink?: boolean;
  onShareClick?: () => void;
  onNewChat?: () => void;
  workspaceName?: string;
  isWorkspaceLoading?: boolean;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
  inspectorCollapsed?: boolean;
  setInspectorCollapsed?: (v: boolean) => void;
};

export default function Header({
  title = "ECHO BOARD",
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  projectName,
  chatTitle,
  onProjectNameClick,
  onChatTitleClick,
  workspaceName,
  isWorkspaceLoading,
  isSidebarOpen,
  setIsSidebarOpen,
  inspectorCollapsed,
  setInspectorCollapsed,
}: HeaderProps) {
  useChatModel();
  useSetChatModel();
  return (
    <AppHeader>
        <div className="flex items-center gap-2">
        {setIsSidebarCollapsed !== undefined && isSidebarCollapsed !== undefined && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex h-8 w-8 items-center justify-center"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-pressed={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? "サイドバーを表示" : "サイドバーを隠す"}
            title={isSidebarCollapsed ? "サイドバーを表示" : "サイドバーを隠す"}
            aria-controls="threads-rail"
          >
            <MutedText level={40}>≡</MutedText>
          </Button>
        )}
        {setIsSidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden inline-flex h-8 w-8 items-center justify-center"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="メニュー"
            aria-label="メニュー"
            aria-controls="threads-rail"
          >
            <MutedText level={40}>☰</MutedText>
          </Button>
        )}
        {projectName && chatTitle ? (
          <div className="flex items-center gap-2">
            <button className="text-sm font-medium" onClick={onProjectNameClick}>{projectName}</button>
            <MutedText level={40}>&gt;</MutedText>
            <button className="text-xs" onClick={onChatTitleClick}>{chatTitle}</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" aria-hidden />
            <span className="text-sm">{title}</span>
            {workspaceName && (
              <Chip as="span" size="sm" variant="neutral" className="text-[10px]">
                {isWorkspaceLoading ? "..." : workspaceName}
              </Chip>
            )}
          </div>
        )}
        {/* モデル選択はComposer側に集約するためヘッダーから削除 */}
        </div>
        <div className="flex items-center gap-2">
        {/* モデル選択は左側へ移動済み */}
        <HeaderShareMenu />
        {setInspectorCollapsed !== undefined && inspectorCollapsed !== undefined && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex h-8 w-8 items-center justify-center"
            onClick={() => setInspectorCollapsed(!inspectorCollapsed)}
            aria-pressed={!inspectorCollapsed}
            aria-label={inspectorCollapsed ? "エビデンスを表示" : "エビデンスを隠す"}
            title={inspectorCollapsed ? "エビデンスを表示" : "エビデンスを隠す"}
            aria-controls="inspector-dock"
          >
            <MutedText level={40}>{inspectorCollapsed ? "≫" : "≪"}</MutedText>
          </Button>
        )}
        </div>
      </AppHeader>
  );
}
