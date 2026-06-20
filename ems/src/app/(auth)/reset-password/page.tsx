"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      // Logic for password reset update will call Firebase auth update here
      console.log("Reset password request", data.password);
      setSent(true);
    } catch {
      setError("Unable to reset password. Link might be expired or invalid.");
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
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Password Updated</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
            Your password has been successfully reset. You can now log in.
          </p>
          <a href="/login" className="btn btn-primary" style={{ display: "inline-flex" }}>
            Go to login
          </a>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Set new password</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 28 }}>
            Enter your new password below.
          </p>
          {error && <p style={{ fontSize: 13, color: "var(--accent-red)", marginBottom: 16 }}>{error}</p>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="new-password"
                  type={showPass ? "text" : "password"}
                  className="input-base"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 12, color: "var(--accent-red)", marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                className="input-base"
                placeholder="••••••••"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p style={{ fontSize: 12, color: "var(--accent-red)", marginTop: 4 }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "11px 16px" }} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {isSubmitting ? "Updating…" : "Reset Password"}
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
