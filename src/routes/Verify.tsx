import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Info, Eye, EyeOff } from "lucide-react";
import { register } from "../lib/api";
import { Link } from "react-router-dom";

export default function Verify() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("")
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attested, setAttested] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isValid = email.trim() && password.length >= 12 && attested;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setTouched(true);
    setError(null);

    if (!isValid) {
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        practitioner_attestation: true,
      });

      navigate("/chat", {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create your account.",
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
            <ShieldCheck size={18} className="text-risklow" />
          </div>

          <span className="font-display text-white text-lg font-semibold tracking-wide">
            DIFFERENTIAL DX
          </span>
        </div>

        <div className="bg-paper border border-paperBorder rounded-2xl p-6">
          <h1 className="font-display text-[#1B2620] text-lg font-semibold mb-1">
            Practitioner access
          </h1>

          <p className="text-[#5B6B60] text-xs mb-5">
            Create an account to access the clinical decision-support
            application.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Email */}
            <div>
              <label className="block text-[#1B2620] text-xs font-medium mb-1">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-xl px-3 py-2 text-sm bg-white border border-paperBorder text-[#1B2620] focus:outline-none"
                placeholder="Dr. John Doe"
              />

              {touched && !email.trim() && (
                <p className="text-riskhigh text-[11px] mt-1">
                  Email is required.
                </p>
              )}
            </div>
            <div>
              <label className="block text-[#1B2620] text-xs font-medium mb-1">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl px-3 py-2 text-sm bg-white border border-paperBorder text-[#1B2620] focus:outline-none"
                placeholder="doctor@example.com"
              />

              {touched && !email.trim() && (
                <p className="text-riskhigh text-[11px] mt-1">
                  Email is required.
                </p>
              )}
            </div>

            {/* Password */}

            <div>
              <label className="block text-[#1B2620] text-xs font-medium mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl px-3 py-2 pr-10 text-sm bg-white border border-paperBorder text-[#1B2620] focus:outline-none"
                  placeholder="At least 12 characters"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#5B6B60] hover:text-[#1B2620] focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {touched && password.length < 12 && (
                <p className="text-riskhigh text-[11px] mt-1">
                  Password must contain at least 12 characters.
                </p>
              )}
            </div>

            {/* Self-attestation */}

            <label className="flex items-start gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
                className="mt-0.5"
              />

              <span className="text-[#1B2620] text-xs">
                I confirm that I am a licensed healthcare professional and will
                use this tool for clinical decision support only, not as a
                substitute for professional judgement.
              </span>
            </label>

            {touched && !attested && (
              <p className="text-riskhigh text-[11px] -mt-2">
                Confirmation required to continue.
              </p>
            )}

            {/* Backend error */}

            {error && (
              <div className="rounded-xl border border-riskhigh/30 bg-riskhigh/5 px-3 py-2">
                <p className="text-riskhigh text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating account..." : "Create account & continue"}
            </button>
            <div className="mt-5 text-center">
              <p className="text-[#5B6B60] text-xs">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-[#1B2620] underline underline-offset-2"
                >
                  Create one
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="flex items-start gap-2 mt-4 px-1">
          <Info size={13} className="text-panelBorder flex-shrink-0 mt-0.5" />

          <p className="text-[11px] text-[#8FA1A7]">
            Professional identity is not currently verified against a licensing
            registry. Access is based on self-attestation. A future verification
            service can be integrated without changing the application's
            authentication architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
