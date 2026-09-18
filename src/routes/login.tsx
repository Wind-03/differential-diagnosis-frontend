import { useState, FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Info, Eye, EyeOff } from 'lucide-react';
import { login } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from =
    (location.state as { from?: string } | null)?.from ||
    '/chat';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError(null);

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-lg bg-panel border border-panelBorder flex items-center justify-center">
            <ShieldCheck
              size={18}
              className="text-risklow"
            />
          </div>

          <span className="font-display text-white text-lg font-semibold tracking-wide">
            DIFFERENTIAL DX
          </span>
        </div>

        <div className="bg-paper border border-paperBorder rounded-2xl p-6">

          <div className="flex items-center gap-2 mb-1">
            <LogIn
              size={18}
              className="text-[#1B2620]"
            />

            <h1 className="font-display text-[#1B2620] text-lg font-semibold">
              Sign in
            </h1>
          </div>

          <p className="text-[#5B6B60] text-xs mb-5">
            Sign in to access your clinical decision-support
            workspace.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3.5"
          >

            <div>
              <label
                htmlFor="email"
                className="block text-[#1B2620] text-xs font-medium mb-1"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl px-3 py-2 text-sm bg-white border border-paperBorder text-[#1B2620] focus:outline-none"
                placeholder="doctor@example.com"
                disabled={submitting}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[#1B2620] text-xs font-medium mb-1"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl px-3 py-2 pr-10 text-sm bg-white border border-paperBorder text-[#1B2620] focus:outline-none"
                  placeholder="Your password"
                  disabled={submitting}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                  disabled={submitting}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#5B6B60] hover:text-[#1B2620] focus:outline-none disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-riskhigh/30 bg-riskhigh/5 px-3 py-2">
                <p className="text-riskhigh text-xs">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Signing in...'
                : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-[#5B6B60] text-xs">
              Don't have an account?{' '}
              <Link
                to="/verify"
                className="font-medium text-[#1B2620] underline underline-offset-2"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 mt-4 px-1">
          <Info
            size={13}
            className="text-panelBorder flex-shrink-0 mt-0.5"
          />

          <p className="text-[11px] text-[#8FA1A7]">
            Professional identity verification is not currently
            performed against a licensing registry. Practitioner
            access is self-attested.
          </p>
        </div>
      </div>
    </div>
  );
}