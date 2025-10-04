'use client';

import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Link as LinkIcon,
  MoreHorizontal,
  Trash2,
  Plus,
  Loader2,
  Share2,
  X,
  Check,
  History,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import { usePathname, useRouter } from "next/navigation"
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import Link from "next/link"
import Image from 'next/image';
import { ShareModal } from "./share-modal"
import { DeleteConfirmationDialog } from "@/components/thread/DeleteConfirmationDialog"
import { useDeleteOperation } from '@/contexts/DeleteOperationContext'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ThreadWithProject } from '@/hooks/react-query/sidebar/use-sidebar';
import { processThreadsWithProjects, useDeleteMultipleThreads, useDeleteThread, useProjects, useThreads } from '@/hooks/react-query/sidebar/use-sidebar';
import { projectKeys, threadKeys } from '@/hooks/react-query/sidebar/keys';
import addSVG from '#/add-ico.svg';

export function NavAgents() {
  const { t } = useTranslation();
  const { isMobile, state } = useSidebar()
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ threadId: string, projectId: string } | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [threadToDelete, setThreadToDelete] = useState<{ id: string; name: string } | null>(null)
  const isNavigatingRef = useRef(false)
  const { performDelete } = useDeleteOperation();
  const isPerformingActionRef = useRef(false);
  const queryClient = useQueryClient();

  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [totalToDelete, setTotalToDelete] = useState(0);

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError
  } = useProjects();

  const {
    data: threads = [],
    isLoading: isThreadsLoading,
    error: threadsError
  } = useThreads();

  const { mutate: deleteThreadMutation, isPending: isDeletingSingle } = useDeleteThread();
  const {
    mutate: deleteMultipleThreadsMutation,
    isPending: isDeletingMultiple
  } = useDeleteMultipleThreads();

  const combinedThreads: ThreadWithProject[] =
    !isProjectsLoading && !isThreadsLoading ?
      processThreadsWithProjects(threads, projects) : [];

  const handleDeletionProgress = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    setDeleteProgress(percentage);
  };

  useEffect(() => {
    const handleProjectUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { projectId, updatedData } = customEvent.detail;
        queryClient.invalidateQueries({ queryKey: projectKeys.details(projectId) });
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      }
    };

    window.addEventListener('project-updated', handleProjectUpdate as EventListener);
    return () => {
      window.removeEventListener(
        'project-updated',
        handleProjectUpdate as EventListener,
      );
    };
  }, [queryClient]);

  useEffect(() => {
    setLoadingThreadId(null);
  }, [pathname]);

  useEffect(() => {
    const handleNavigationComplete = () => {
      console.log('NAVIGATION - Navigation event completed');
      document.body.style.pointerEvents = 'auto';
      isNavigatingRef.current = false;
    };

    window.addEventListener("popstate", handleNavigationComplete);

    return () => {
      window.removeEventListener('popstate', handleNavigationComplete);
      // Ensure we clean up any leftover styles
      document.body.style.pointerEvents = "auto";
    };
  }, []);

  // Reset isNavigatingRef when pathname changes
  useEffect(() => {
    isNavigatingRef.current = false;
    document.body.style.pointerEvents = 'auto';
  }, [pathname]);

  // Function to handle thread click with loading state
  const handleThreadClick = (e: React.MouseEvent<HTMLAnchorElement>, threadId: string, url: string) => {
    // If thread is selected, prevent navigation 
    if (selectedThreads.has(threadId)) {
      e.preventDefault();
      return;
    }

    e.preventDefault()
    setLoadingThreadId(threadId)
    router.push(url)
  }

  // Toggle thread selection for multi-select
  const toggleThreadSelection = (threadId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setSelectedThreads(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(threadId)) {
        newSelection.delete(threadId);
      } else {
        newSelection.add(threadId);
      }
      return newSelection;
    });
  };

  // Select all threads
  const selectAllThreads = () => {
    const allThreadIds = combinedThreads.map(thread => thread.threadId);
    setSelectedThreads(new Set(allThreadIds));
  };

  // Deselect all threads
  const deselectAllThreads = () => {
    setSelectedThreads(new Set());
  };

  // Function to handle thread deletion
  const handleDeleteThread = async (threadId: string, threadName: string) => {
    setThreadToDelete({ id: threadId, name: threadName });
    setIsDeleteDialogOpen(true);
  };

  // Function to handle multi-delete
  const handleMultiDelete = () => {
    if (selectedThreads.size === 0) return;

    // Get thread names for confirmation dialog
    const threadsToDelete = combinedThreads.filter(t => selectedThreads.has(t.threadId));
    const threadNames = threadsToDelete.map(t => t.projectName).join(", ");

    setThreadToDelete({
      id: "multiple",
      name: selectedThreads.size > 3
        ? `${selectedThreads.size} conversations`
        : threadNames
    });

    setTotalToDelete(selectedThreads.size);
    setDeleteProgress(0);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!threadToDelete || isPerformingActionRef.current) return;

    // Mark action in progress
    isPerformingActionRef.current = true;

    // Close dialog first for immediate feedback
    setIsDeleteDialogOpen(false);

    // Check if it's a single thread or multiple threads
    if (threadToDelete.id !== "multiple") {
      // Single thread deletion
      const threadId = threadToDelete.id;
      const isActive = pathname?.includes(threadId);

      // Store threadToDelete in a local variable since it might be cleared
      const deletedThread = { ...threadToDelete };

      // Get sandbox ID from projects data
      const thread = combinedThreads.find(t => t.threadId === threadId);
      const project = projects.find(p => p.id === thread?.projectId);
      const sandboxId = project?.sandbox?.id;

      // Log operation start
      console.log('DELETION - Starting thread deletion process', {
        threadId: deletedThread.id,
        isCurrentThread: isActive,
        sandboxId
      });

      // Use the centralized deletion system with completion callback
      await performDelete(
        threadId,
        isActive,
        async () => {
          // Delete the thread using the mutation with sandbox ID
          deleteThreadMutation(
            { threadId, sandboxId },
            {
              onSuccess: () => {
                // Invalidate queries to refresh the list
                queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
                toast.success(t('common.success'));
              },
              onSettled: () => {
                setThreadToDelete(null);
                isPerformingActionRef.current = false;
              }
            }
          );
        },
        // Completion callback to reset local state
        () => {
          setThreadToDelete(null);
          isPerformingActionRef.current = false;
        },
      );
    } else {
      // Multi-thread deletion
      const threadIdsToDelete = Array.from(selectedThreads);
      const isActiveThreadIncluded = threadIdsToDelete.some(id => pathname?.includes(id));

      // Show initial toast
      toast.info(t('sidebar.deletingConversations', { count: threadIdsToDelete.length }));

      try {
        // If the active thread is included, handle navigation first
        if (isActiveThreadIncluded) {
          // Navigate to dashboard before deleting
          isNavigatingRef.current = true;
          document.body.style.pointerEvents = 'none';
          router.push('/dashboard');

          // Wait a moment for navigation to start
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Use the mutation for bulk deletion
        deleteMultipleThreadsMutation(
          {
            threadIds: threadIdsToDelete,
            threadSandboxMap: Object.fromEntries(
              threadIdsToDelete.map(threadId => {
                const thread = combinedThreads.find(t => t.threadId === threadId);
                const project = projects.find(p => p.id === thread?.projectId);
                return [threadId, project?.sandbox?.id || ''];
              }).filter(([, sandboxId]) => sandboxId)
            ),
            onProgress: handleDeletionProgress
          },
          {
            onSuccess: (data) => {
              // Invalidate queries to refresh the list
              queryClient.invalidateQueries({ queryKey: threadKeys.lists() });

              // Show success message
              toast.success(t('sidebar.deletedSuccessfully', { count: data.successful.length }));

              // If some deletions failed, show warning
              if (data.failed.length > 0) {
                toast.warning(t('sidebar.deletionFailed', { count: data.failed.length }));
              }

              // Reset states
              setSelectedThreads(new Set());
              setDeleteProgress(0);
              setTotalToDelete(0);
            },
            onError: (error) => {
              console.error('Error in bulk deletion:', error);
              toast.error(t('sidebar.errorDeletingConversations'));
            },
            onSettled: () => {
              setThreadToDelete(null);
              isPerformingActionRef.current = false;
              setDeleteProgress(0);
              setTotalToDelete(0);
            }
          }
        );
      } catch (err) {
        console.error('Error initiating bulk deletion:', err);
        toast.error(t('sidebar.errorInitiatingDeletion'));

        // Reset states
        setSelectedThreads(new Set());
        setThreadToDelete(null);
        isPerformingActionRef.current = false;
        setDeleteProgress(0);
        setTotalToDelete(0);
      }
    }
  };

  // Loading state or error handling
  const isLoading = isProjectsLoading || isThreadsLoading;
  const hasError = projectsError || threadsError;

  if (hasError) {
    console.error('Error loading data:', { projectsError, threadsError });
  }

  return (
    <>
      {/* Sticky new agent button for expanded state */}
      {state !== 'collapsed' && (
        <div className="sticky top-0 z-10 bg-[#FFFFFF] dark:bg-[#202426]">
          <div className="flex justify-center items-center">
            {selectedThreads.size > 0 ? (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={deselectAllThreads}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={selectAllThreads}
                  disabled={selectedThreads.size === combinedThreads.length}
                  className="h-8 w-8"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMultiDelete}
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link
                href="/dashboard"
                className="w-full bg-[#3363FF] hover:bg-[#3363FF]/70 text-[#FFFFFF] hover:text-[#FFFFFF]/70 text-[18px] font-normal rounded-md transition-all duration-100 flex items-center justify-center gap-1.5 h-12"
              >
                <Image src={addSVG} alt="" style={{ width: 14, height: 14 }} />
                <span>{t('sidebar.newChat')}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Collapsed state new agent button */}
      {state === 'collapsed' && (
        <div className="sticky top-0 z-10 bg-[#FFFFFF] dark:bg-[#202426] pb-2 pt-2 flex justify-center">
          <SidebarMenuItem className="list-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SidebarMenuButton asChild className="w-full bg-[#3363FF] hover:bg-[#3363FF]/70 text-[#FFFFFF] hover:text-[#FFFFFF]/70 text-[18px] font-normal rounded-md transition-all duration-100 flex items-center justify-center h-12">
                    <Link href="/dashboard" className="flex items-center">
                      <Image src={addSVG} alt="" style={{ width: 14, height: 14 }} />
                    </Link>
                  </SidebarMenuButton>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t('sidebar.newChat')}</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </div>
      )}

      <SidebarGroup className='p-0 mt-3'>
        <SidebarMenu className='gap-0'>

        {isLoading ? (
          // Show skeleton loaders while loading
          Array.from({ length: 3 }).map((_, index) => (
            <SidebarMenuItem key={`skeleton-${index}`}>
              <SidebarMenuButton className='h-[48px]'>
                <div className="h-4 w-4 bg-sidebar-foreground/10 rounded-md animate-pulse"></div>
                <div className="h-3 bg-sidebar-foreground/10 rounded w-3/4 animate-pulse"></div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        ) : combinedThreads.length > 0 ? (
          // Show all threads with project info
          <>
            {combinedThreads.map((thread) => {
              // Check if this thread is currently active
              const isActive = pathname?.includes(thread.threadId) || false;
              const isThreadLoading = loadingThreadId === thread.threadId;
              const isSelected = selectedThreads.has(thread.threadId);

              return (
                <SidebarMenuItem key={`thread-${thread.threadId}`} className="mb-2">
                  {state === 'collapsed' ? (
                    <div className="relative !h-[48px] flex items-center justify-center">
                      <SidebarMenuButton
                        asChild
                         className="relative"
                      >
                        <Tooltip>
                          <TooltipTrigger>
                            <Link
                              className={`flex items-center justify-center m-0 p-0 !w-10 !h-10 rounded-xl ${
                                isActive ? '!bg-[#F2F5FF] dark:!bg-[#303338] font-medium' :
                                  isSelected ? '!bg-[#F2F5FF] dark:!bg-[#303338]' : ''
                              }`}
                              href={thread.url}
                              onClick={(e) =>
                                handleThreadClick(e, thread.threadId, thread.url)
                              }
                            >
                              {isThreadLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                !isMobile && (
                                  <span>
                                    {thread.projectName.charAt(0)}
                                  </span>
                                )
                              )}
                              {isMobile && <span>{thread.projectName}</span>}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>{thread.projectName}</TooltipContent>
                        </Tooltip>
                      </SidebarMenuButton>
                    </div>
                  ) : (
                    <div className="relative">
                      <SidebarMenuButton
                        asChild
                        className={`relative h-10 rounded-xl m-0 p-0 ${isActive
                          ? '!bg-[#F2F5FF] dark:!bg-[#303338] font-medium'
                          : isSelected
                            ? '!bg-[#F2F5FF] dark:!bg-[#303338]'
                            : ''
                          }`}
                      >
                        <Link
                          href={thread.url}
                          onClick={(e) =>
                            handleThreadClick(e, thread.threadId, thread.url)
                          }
                          className="flex items-center m-0 p-0"
                        >
                          <div className="flex items-center group/icon relative">
                            {/* Show checkbox on hover or when selected */}
                            {isThreadLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <div
                                className={`flex items-center justify-center transition-opacity duration-150 ${isSelected
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover/icon:opacity-100'
                                  }`}
                                onClick={(e) => toggleThreadSelection(thread.threadId, e)}
                              >
                                {/* <div
                                  className={`h-4 w-4 border rounded cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-center ${isSelected
                                    ? 'bg-primary border-primary'
                                    : 'border-muted-foreground/30 bg-background'
                                    }`}
                                >
                                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                </div> */}
                              </div>
                            )}
                          </div>
                          <span className="ml-4 text-[#0F0F0F] dark:text-[#FFFFFF] font-medium">{thread.projectName}</span>
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  )}
                  {state !== 'collapsed' && !isSelected && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction
                          showOnHover
                          className="group-hover:opacity-100 mr-5"
                          onClick={() => {
                            // Ensure pointer events are enabled when dropdown opens
                            document.body.style.pointerEvents = 'auto';
                          }}
                        >
                          <MoreHorizontal />
                          <span className="sr-only">{t('sidebar.more')}</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-[#F2F5FF] dark:bg-[#16191A]">
                        <DropdownMenuItem onClick={() => {
                          setSelectedItem({ threadId: thread?.threadId, projectId: thread?.projectId })
                          setShowShareModal(true)
                        }}>
                          <Share2 className="mr-2 h-4 w-4 text-blue-500" />
                          <span>{t('sidebar.shareChat')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            href={thread.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="mr-2 h-4 w-4 text-green-500" />
                            <span>{t('sidebar.openInNewTab')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteThread(thread.threadId, thread.projectName);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                          <span>{t('sidebar.delete')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </SidebarMenuItem>
              );
            })}
          </>
        ) : (
          <SidebarMenuItem>
            <div className="flex items-center justify-center p-4 text-[#0F0F0F] text-lg dark:text-[#FFFFFF]">
              {t('sidebar.noChatsYet')}
            </div>
          </SidebarMenuItem>
        )}
        </SidebarMenu>
      </SidebarGroup>

      {(isDeletingSingle || isDeletingMultiple) && totalToDelete > 0 && (
        <div className="mt-2 px-2">
          <div className="text-xs text-muted-foreground mb-1">
            Deleting {deleteProgress > 0 ? `(${Math.floor(deleteProgress)}%)` : '...'}
          </div>
          <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
            <div
              className="bg-primary h-1 transition-all duration-300 ease-in-out"
              style={{ width: `${deleteProgress}%` }}
            />
          </div>
        </div>
      )}

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        threadId={selectedItem?.threadId}
        projectId={selectedItem?.projectId}
      />

      {threadToDelete && (
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          threadName={threadToDelete.name}
          isDeleting={isDeletingSingle || isDeletingMultiple}
        />
      )}
    </>
  );
}