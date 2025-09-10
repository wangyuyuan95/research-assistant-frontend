'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EditorContent,
  type EditorInstance,
  EditorRoot,
  type JSONContent,
} from "novel";
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { Save, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';
import { Textarea } from '@/components/ui/textarea';

// Simple extensions for todo editing (no AI)
import { 
  StarterKit,
  Placeholder,
  TaskList,
  TaskItem,
  HorizontalRule,
  TiptapLink,
  TiptapUnderline,
  TextStyle,
  Color,
  GlobalDragHandle,
} from "novel";
import { Markdown } from "tiptap-markdown";
import { cx } from "class-variance-authority";

// Simple extensions without AI features
const placeholder = Placeholder.configure({
  placeholder: "开始编辑您的 Todo 列表...",
});

const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: cx(
      "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
    ),
  },
});

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx("not-prose pl-2 "),
  },
});

const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cx("flex gap-2 items-start my-4"),
  },
  nested: true,
});

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cx("mt-4 mb-6 border-t border-muted-foreground"),
  },
});

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: cx("list-disc list-outside leading-3 -mt-2"),
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: cx("list-decimal list-outside leading-3 -mt-2"),
    },
  },
  listItem: {
    HTMLAttributes: {
      class: cx("leading-normal -mb-2"),
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: cx("border-l-4 border-primary"),
    },
  },
  code: {
    HTMLAttributes: {
      class: cx("rounded-md bg-muted px-1.5 py-1 font-mono font-medium"),
      spellcheck: "false",
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: "#DBEAFE",
    width: 4,
  },
  gapcursor: false,
});

const markdownExtension = Markdown.configure({
  html: true,
  tightLists: true,
  tightListClass: "tight",
  bulletListMarker: "-",
  linkify: false,
  breaks: false,
  transformPastedText: false,
  transformCopiedText: false,
});

const globalDragHandle = GlobalDragHandle.configure({});

const todoExtensions = [
  starterKit,
  placeholder,
  tiptapLink,
  taskList,
  taskItem,
  horizontalRule,
  markdownExtension,
  TiptapUnderline,
  TextStyle,
  Color,
  globalDragHandle,
];

export interface TodoSourceEditorProps {
  content: string;
  onChange?: (content: string) => void;
  className?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

export interface TodoPreviewEditorProps {
  content: string;
  onChange?: (content: string) => void;
  className?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

// 源码编辑器组件 - 纯文本markdown编辑
export function TodoSourceEditor({ 
  content, 
  onChange,
  className,
  scrollRef
}: TodoSourceEditorProps) {
  const { t } = useTranslation();
  const [sourceContent, setSourceContent] = useState(content);

  // Handle source mode changes
  const handleSourceChange = useCallback((value: string) => {
    setSourceContent(value);
    onChange?.(value);
  }, [onChange]);

  // Update content when prop changes
  useEffect(() => {
    setSourceContent(content);
  }, [content]);

    return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Source content editor */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <Textarea
            value={sourceContent}
            onChange={(e) => handleSourceChange(e.target.value)}
            className="min-h-[calc(100vh-210px)] w-full font-mono text-xs whitespace-pre-wrap text-zinc-800 dark:text-zinc-300 resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent p-4 leading-relaxed"
            placeholder="# Todo List"
          />
        </ScrollArea>
      </div>
    </div>
  );
}

// 预览编辑器组件 - 所见即所得富文本编辑
export function TodoPreviewEditor({ 
  content, 
  onChange,
  className,
  scrollRef
}: TodoPreviewEditorProps) {
  const { t } = useTranslation();
  const [previewContent, setPreviewContent] = useState(content);
  const [isUserEditing, setIsUserEditing] = useState(false);
  
  const editorRef = useRef<EditorInstance | null>(null);
  
  // Convert markdown to editor JSON format
  const parseMarkdownToJson = useCallback((markdown: string): JSONContent => {
    if (!markdown) {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [],
          },
        ],
      };
    }
    
    // Let the editor handle markdown parsing
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: markdown,
            },
          ],
        },
      ],
    };
  }, []);

  // Fix escaped brackets in markdown
  const fixMarkdownEscaping = useCallback((markdown: string): string => {
    // Replace escaped brackets in task lists: \[ \] -> [ ]
    return markdown
      .replace(/- \\\[\s\\\]/g, '- [ ]')  // unchecked tasks: - \[ \]
      .replace(/- \\\[x\\\]/g, '- [x]')   // checked tasks: - \[x\]
      .replace(/- \\\[\\\]/g, '- [ ]');   // sometimes it's just \[\]
  }, []);

  // Debounced update for preview mode
  const debouncedPreviewUpdate = useDebouncedCallback(
    (editor: EditorInstance) => {
      try {
        setIsUserEditing(true);
        // Try to get markdown first
        if (editor.storage.markdown && editor.storage.markdown.getMarkdown) {
          const rawMarkdown = editor.storage.markdown.getMarkdown();
          const fixedMarkdown = fixMarkdownEscaping(rawMarkdown);
          setPreviewContent(fixedMarkdown);
          onChange?.(fixedMarkdown);
        } else {
          // Fallback: get plain text content
          const textContent = editor.getText();
          setPreviewContent(textContent);
          onChange?.(textContent);
        }
      } catch (error) {
        console.error('Error getting content:', error);
        // Final fallback: use HTML content
        const htmlContent = editor.getHTML();
        setPreviewContent(htmlContent);
        onChange?.(htmlContent);
      } finally {
        // Reset user editing flag after a delay
        setTimeout(() => setIsUserEditing(false), 500);
      }
    },
    300,
  );

  // Update content when prop changes (but not when user is editing)
  useEffect(() => {
    if (!isUserEditing && content !== previewContent) {
      setPreviewContent(content);
      if (editorRef.current && content) {
        try {
          // Use setContent instead of setMarkdown
          editorRef.current.commands.setContent(content);
        } catch (error) {
          console.error('Error setting content:', error);
        }
      }
    }
  }, [content, isUserEditing, previewContent]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Preview content editor */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="px-6 py-4">
            <EditorRoot>
              <EditorContent
                immediatelyRender={false}
                initialContent={parseMarkdownToJson(previewContent)}
                extensions={todoExtensions}
                className="border-0 focus:outline-none"
                editorProps={{
                  attributes: {
                    class: "todo-editor-content prose prose-base dark:prose-invert prose-zinc focus:outline-none max-w-full min-h-[500px]",
                  },
                }}
                onCreate={({ editor }) => {
                  editorRef.current = editor;
                  // Set initial markdown content
                  setTimeout(() => {
                    if (previewContent) {
                      try {
                        // Use setContent method instead of setMarkdown
                        editor.commands.setContent(previewContent);
                      } catch (error) {
                        console.error('Error setting initial content:', error);
                      }
                    }
                  }, 100);
                }}
                onUpdate={({ editor }) => {
                  editorRef.current = editor;
                  debouncedPreviewUpdate(editor);
                }}
              />
            </EditorRoot>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 