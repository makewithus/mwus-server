"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { sendReset } = useAuthStore();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await sendReset(data.email);
      setSent(true);
    } catch {
      setError("Unable to send reset email. Check the address and try again.");
    }
  };

  return (
    <div className="card animate-fadeIn" style={{ padding: "36px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>EMS Pro</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Employee Management</div>
        </div>
      </div>

      {sent ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <CheckCircle2 size={40} color="var(--accent-green)" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Check your email</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
            We&apos;ve sent a password reset link. Check your inbox.
          </p>
          <a href="/login" className="btn btn-secondary" style={{ display: "inline-flex" }}>
            <ArrowLeft size={14} /> Back to login
          </a>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Reset your password</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 28 }}>
            Enter your email and we&apos;ll send a reset link.
          </p>
          {error && <p style={{ fontSize: 13, color: "var(--accent-red)", marginBottom: 16 }}>{error}</p>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Email address</label>
              <input id="reset-email" type="email" className="input-base" placeholder="you@company.com" {...register("email")} />
              {errors.email && <p style={{ fontSize: 12, color: "var(--accent-red)", marginTop: 4 }}>{errors.email.message}</p>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "11px 16px" }} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
          <a href="/login" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 20, fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to login
          </a>
        </>
      )}
    </div>
  );
}
