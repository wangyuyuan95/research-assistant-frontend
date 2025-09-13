'use client';

import Link from 'next/link';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { FlickeringGrid } from '@/components/home/ui/flickering-grid';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useScroll } from 'motion/react';
import { signIn, signUp, forgotPassword } from '../auth/actions';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  X,
  CheckCircle,
  AlertCircle,
  MailCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useTranslation } from 'react-i18next';
import { KnowledgeBaseIntegration } from '@/lib/kb-integration';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

function HomeContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const mode = searchParams.get('mode');
  const returnUrl = searchParams.get('returnUrl');
  const message = searchParams.get('message');

  const isSignUp = mode === 'signup';
  const tablet = useMediaQuery('(max-width: 1024px)');
  const [mounted, setMounted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();

  // Redirect if user is already logged in, checking isLoading state
  useEffect(() => {
    if (!isLoading && user) {
      router.push(returnUrl || '/dashboard');
    }
  }, [user, isLoading, router, returnUrl]);

  // Determine if message is a success message
  const isSuccessMessage =
    message &&
    (message.includes('Check your email') ||
      message.includes('Account created') ||
      message.includes('success'));

  // Registration success state
  const [registrationSuccess, setRegistrationSuccess] =
    useState(!!isSuccessMessage);
  const [registrationEmail, setRegistrationEmail] = useState('');

  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set registration success state from URL params
  useEffect(() => {
    if (isSuccessMessage) {
      setRegistrationSuccess(true);
    }
  }, [isSuccessMessage]);

  // Detect when scrolling is active to reduce animation complexity
  useEffect(() => {
    const unsubscribe = scrollY.on('change', () => {
      setIsScrolling(true);

      // Clear any existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set a new timeout
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 300); // Wait 300ms after scroll stops
    });

    return () => {
      unsubscribe();
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [scrollY]);

  // 提取知识库集成逻辑为共用函数
  const performKBIntegration = async (email: string) => {
    const kbUrl = process.env.NEXT_PUBLIC_KB_URL;
    if (kbUrl && kbUrl.trim() !== '') {
      try {
        console.log('🔗 Knowledge base URL detected:', kbUrl);
        console.log('🚀 Starting knowledge base integration...');
        console.log('📧 User email for integration:', email);

        const kbIntegration = new KnowledgeBaseIntegration(kbUrl);
        const integrationResult = await kbIntegration.integrateUser(email);
        
        if (integrationResult.success) {
          console.log('✅ Knowledge base integration completed successfully!');
          console.log('💾 Integration data:', integrationResult.data);
          
          // Store integration success flag and detailed information
          localStorage.setItem('kb_integration_success', 'true');
          localStorage.setItem('kb_integration_timestamp', Date.now().toString());
          localStorage.setItem('kb_integration_details', JSON.stringify({
            userEmail: email,
            kbEmail: `${process.env.NEXT_PUBLIC_KB_ACCOUNT_PREFIX}${email}`,
            apiKey: integrationResult.data?.apiKey,
            timestamp: Date.now()
          }));
          
          console.log('📋 Stored integration details in localStorage');
        } else {
          console.error('❌ Knowledge base integration failed:', integrationResult.error);
          // Store integration failure info but continue with normal flow
          localStorage.setItem('kb_integration_success', 'false');
          localStorage.setItem('kb_integration_error', integrationResult.error || 'Unknown error');
        }
      } catch (error) {
        console.error('💥 Knowledge base integration error:', error);
        // Store integration failure info but continue with normal flow
        localStorage.setItem('kb_integration_success', 'false');
        localStorage.setItem('kb_integration_error', error instanceof Error ? error.message : 'Unknown error');
      }
    } else {
      console.log('🚫 Knowledge base integration disabled (NEXT_PUBLIC_KB_URL not set)');
    }
  };

  const handleSignIn = async (prevState: any, formData: FormData) => {
    if (returnUrl) {
      formData.append('returnUrl', returnUrl);
    } else {
      formData.append('returnUrl', '/dashboard');
    }
    const result = await signIn(prevState, formData);

    // Check for success and redirectTo properties
    if (
      result &&
      typeof result === 'object' &&
      'success' in result &&
      result.success &&
      'redirectTo' in result
    ) {
      // Get user email from form data and perform KB integration
      const email = formData.get('email') as string;
      if (email) {
        await performKBIntegration(email);
      }

      // Use window.location for hard navigation to avoid stale state
      window.location.href = result.redirectTo as string;
      return null; // Return null to prevent normal form action completion
    }

    return result;
  };

  const handleSignUp = async (prevState: any, formData: FormData) => {
    // Store email for success state
    const email = formData.get('email') as string;
    setRegistrationEmail(email);

    if (returnUrl) {
      formData.append('returnUrl', returnUrl);
    }

    // Add origin for email redirects
    formData.append('origin', window.location.origin);

    const result = await signUp(prevState, formData);

    // Check for success and redirectTo properties (direct login case)
    if (
      result &&
      typeof result === 'object' &&
      'success' in result &&
      result.success &&
      'redirectTo' in result
    ) {
      // Perform KB integration for direct registration->login case
      if (email) {
        await performKBIntegration(email);
      }

      // Use window.location for hard navigation to avoid stale state
      window.location.href = result.redirectTo as string;
      return null; // Return null to prevent normal form action completion
    }

    // Check if registration was successful but needs email verification
    if (result && typeof result === 'object' && 'message' in result) {
      const resultMessage = result.message as string;
      if (resultMessage.includes('Check your email')) {
        setRegistrationSuccess(true);

        // Update URL without causing a refresh
        const params = new URLSearchParams(window.location.search);
        params.set('message', resultMessage);

        const newUrl =
          window.location.pathname +
          (params.toString() ? '?' + params.toString() : '');

        window.history.pushState({ path: newUrl }, '', newUrl);

        return result;
      }
    }

    return result;
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setForgotPasswordStatus({});

    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      setForgotPasswordStatus({
        success: false,
        message: t('auth.enterValidEmail'),
      });
      return;
    }

    const formData = new FormData();
    formData.append('email', forgotPasswordEmail);
    formData.append('origin', window.location.origin);

    const result = await forgotPassword(null, formData);

    setForgotPasswordStatus(result);
  };

  const resetRegistrationSuccess = () => {
    setRegistrationSuccess(false);
    // Remove message from URL and set mode to signin
    const params = new URLSearchParams(window.location.search);
    params.delete('message');
    params.set('mode', 'signin');

    const newUrl =
      window.location.pathname +
      (params.toString() ? '?' + params.toString() : '');

    window.history.pushState({ path: newUrl }, '', newUrl);

    router.refresh();
  };

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }

  // Registration success view
  if (registrationSuccess) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-full divide-y divide-border">
          <section className="w-full relative overflow-hidden">
            <div className="relative flex flex-col items-center w-full px-6">
              {/* Background elements from the original view */}
              <div className="absolute left-0 top-0 h-[600px] md:h-[800px] w-1/3 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background z-10" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />
              </div>

              <div className="absolute right-0 top-0 h-[600px] md:h-[800px] w-1/3 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background z-10" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />
              </div>

              <div className="absolute inset-x-1/4 top-0 h-[600px] md:h-[800px] -z-20 bg-background rounded-b-xl"></div>

              {/* Success content */}
              <div className="relative z-10 pt-24 pb-8 max-w-xl mx-auto h-full w-full flex flex-col gap-2 items-center justify-center">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-full p-4 mb-6">
                    <MailCheck className="h-12 w-12 text-green-500 dark:text-green-400" />
                  </div>

                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tighter text-center text-balance text-primary mb-4">
                    {t('auth.checkYourEmail')}
                  </h1>

                  <p className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-md mb-2">
                    {t('auth.checkYourEmailDescription')}
                  </p>

                  <p className="text-lg font-medium mb-6">
                    {registrationEmail || 'your email address'}
                  </p>

                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-lg p-6 mb-8 max-w-md w-full">
                    <p className="text-sm text-green-800 dark:text-green-400 leading-relaxed">
                      {t('auth.clickLinkInEmail')}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <Link
                      href="/"
                      className="flex h-12 items-center justify-center w-full text-center rounded-full border border-border bg-background hover:bg-accent/20 transition-all"
                    >
                      {t('auth.returnToHome')}
                    </Link>
                    <button
                      onClick={resetRegistrationSuccess}
                      className="flex h-12 items-center justify-center w-full text-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                    >
                      {t('auth.backToSignIn')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center w-full" style={{ height:  'calc(100vh - 56px)' }}>
      <div className="w-full divide-y divide-border">
        {/* Hero-like header with flickering grid */}
        <section className="w-full relative overflow-hidden">
          <div className="relative flex flex-col items-center w-full px-6">
            {/* Left side flickering grid with gradient fades */}
            <div className="absolute left-0 top-0 h-[600px] md:h-[800px] w-1/3 -z-10 overflow-hidden">
              {/* Horizontal fade from left to right */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background z-10" />

              {/* Vertical fade from top */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />

              {/* Vertical fade to bottom */}
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />

              <div className="h-full w-full">
                <FlickeringGrid
                  className="h-full w-full"
                  squareSize={mounted && tablet ? 2 : 2.5}
                  gridGap={mounted && tablet ? 2 : 2.5}
                  color="var(--secondary)"
                  maxOpacity={0.4}
                  flickerChance={isScrolling ? 0.01 : 0.03}
                />
              </div>
            </div>

            {/* Right side flickering grid with gradient fades */}
            <div className="absolute right-0 top-0 h-[600px] md:h-[800px] w-1/3 -z-10 overflow-hidden">
              {/* Horizontal fade from right to left */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background z-10" />

              {/* Vertical fade from top */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />

              {/* Vertical fade to bottom */}
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />

              <div className="h-full w-full">
                <FlickeringGrid
                  className="h-full w-full"
                  squareSize={mounted && tablet ? 2 : 2.5}
                  gridGap={mounted && tablet ? 2 : 2.5}
                  color="var(--secondary)"
                  maxOpacity={0.4}
                  flickerChance={isScrolling ? 0.01 : 0.03}
                />
              </div>
            </div>

            {/* Center content background with rounded bottom */}
            <div className="absolute inset-x-1/4 top-0 h-[600px] md:h-[800px] -z-20 bg-background rounded-b-xl"></div>

            {/* Header content */}
            <div className="relative z-10 pt-24 pb-8 max-w-md mx-auto h-full w-full flex flex-col gap-2 items-center justify-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tighter text-center text-balance text-primary">
                {isSignUp ? t('auth.joinResearchAssistant') : t('auth.welcomeBack')}
              </h1>
              <p className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight mt-2 mb-6">
                {isSignUp
                  ? t('auth.createAccountAndStart')
                  : t('auth.signInToAccount')}
              </p>
            </div>
          </div>

          {/* Auth form card */}
          <div className="relative z-10 flex justify-center px-6 pb-24">
            <div className="w-full max-w-md rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-lg border p-8">
              {/* Non-registration related messages */}
              {message && !isSuccessMessage && (
                <div className="mb-6 p-4 rounded-lg flex items-center gap-3 bg-secondary/10 border border-secondary/20 text-secondary">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-secondary" />
                  <span className="text-sm font-medium">{message}</span>
                </div>
              )}

              {/* Form */}
              <form className="space-y-4">
                <div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('auth.emailAddress')}
                    className="h-12 rounded-full bg-background border-border"
                    required
                  />
                </div>

                <div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t('auth.password')}
                    className="h-12 rounded-full bg-background border-border"
                    required
                  />
                </div>

                {isSignUp && (
                  <div>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder={t('auth.confirmPassword')}
                      className="h-12 rounded-full bg-background border-border"
                      required
                    />
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  {!isSignUp ? (
                    <>
                      <SubmitButton
                        formAction={handleSignIn}
                        className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-all shadow-md"
                        pendingText={t('auth.signingIn')}
                      >
                        {t('auth.signIn')}
                      </SubmitButton>

                      <Link
                        href={`/?mode=signup${returnUrl ? `&returnUrl=${returnUrl}` : ''}`}
                        className="flex h-12 items-center justify-center w-full text-center rounded-full border border-border bg-background hover:bg-accent/20 transition-all"
                      >
                        {t('auth.createNewAccount')}
                      </Link>
                    </>
                  ) : (
                    <>
                      <SubmitButton
                        formAction={handleSignUp}
                        className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-all shadow-md"
                        pendingText={t('auth.creatingAccount')}
                      >
                        {t('auth.signUp')}
                      </SubmitButton>

                      <Link
                        href={`/${returnUrl ? `?returnUrl=${returnUrl}` : ''}`}
                        className="flex h-12 items-center justify-center w-full text-center rounded-full border border-border bg-background hover:bg-accent/20 transition-all"
                      >
                        {t('auth.backToSignIn')}
                      </Link>
                    </>
                  )}
                </div>

                {!isSignUp && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md rounded-xl bg-[#F3F4F6] dark:bg-[#17171A] border border-border [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-medium">
                {t('auth.resetPassword')}
              </DialogTitle>
              <button
                onClick={() => setForgotPasswordOpen(false)}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <DialogDescription className="text-muted-foreground">
              {t('auth.enterEmailForReset')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
            <Input
              id="forgot-password-email"
              type="email"
              placeholder={t('auth.emailAddress')}
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              className="h-12 rounded-full bg-background border-border"
              required
            />

            {forgotPasswordStatus.message && (
              <div
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  forgotPasswordStatus.success
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-400'
                    : 'bg-secondary/10 border border-secondary/20 text-secondary'
                }`}
              >
                {forgotPasswordStatus.success ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-secondary" />
                )}
                <span className="text-sm font-medium">
                  {forgotPasswordStatus.message}
                </span>
              </div>
            )}

            <DialogFooter className="flex sm:justify-start gap-3 pt-2">
              <button
                type="submit"
                className="h-12 px-6 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-all shadow-md"
              >
                {t('auth.sendResetLink')}
              </button>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="h-12 px-6 rounded-full border border-border bg-background hover:bg-accent/20 transition-all"
              >
                {t('common.cancel')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col items-center justify-center min-h-screen w-full">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
