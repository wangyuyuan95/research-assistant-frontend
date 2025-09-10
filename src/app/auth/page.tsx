'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 将所有访问 /auth 的请求重定向到首页
    router.replace('/');
  }, [router]);

  return null;
}
