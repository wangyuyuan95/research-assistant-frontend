'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      // 设置全局默认配置确保 toast 能够自动消失
      duration={5000} // 默认5秒后消失
      closeButton={true} // 显示关闭按钮，用户可以手动关闭
      richColors={true} // 启用丰富的颜色
      {...props}
    />
  );
};

export { Toaster };
