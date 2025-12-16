'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'AccessDenied': 'Accès refusé. Vérifiez vos permissions.',
        'Configuration': 'Erreur de configuration du serveur.',
        'Verification': 'Le lien de vérification a expiré.',
        'OAuthSignin': 'Erreur lors de la connexion OAuth.',
        'OAuthCallback': 'Erreur lors du callback OAuth.',
        'OAuthCreateAccount': 'Impossible de créer le compte.',
        'EmailCreateAccount': 'Impossible de créer le compte email.',
        'Callback': 'Erreur lors du callback.',
        'OAuthAccountNotLinked': 'Cet email est déjà lié à un autre compte.',
        'Default': 'Une erreur est survenue.',
      };
      setError(errorMessages[errorParam] || `Erreur: ${errorParam}`);
    }
  }, [searchParams]);

  const handleOAuth = (provider: string) => {
    setOauthLoading(provider);
    setError('');
    signIn(provider, { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">K</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">Komptal</span>
          </Link>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Connexion
          </h1>
          <p className="text-slate-500 mb-8">
            Connectez-vous avec votre compte Google ou Microsoft
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={() => handleOAuth('google')}
              disabled={oauthLoading !== null}
              className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </>
              )}
            </button>

            {/* Microsoft */}
            <button
              onClick={() => handleOAuth('microsoft-entra-id')}
              disabled={oauthLoading !== null}
              className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              {oauthLoading === 'microsoft-entra-id' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  Continuer avec Microsoft
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-slate-900 font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>

      {/* Visual Side */}
      <div className="hidden lg:flex flex-1 bg-slate-950 items-center justify-center p-16 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        
        <div className="max-w-md text-center relative z-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8">
            <span className="text-slate-900 text-2xl font-bold">K</span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Gestion de documents simplifiée
          </h2>
          <p className="text-slate-400">
            Importez vos factures automatiquement, extrayez les données et exportez vers votre comptabilité.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
