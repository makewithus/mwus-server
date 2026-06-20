import { SplitLayout, AuthWrapper } from "@/components/auth/hero";
import { PortalSelectionPage } from "@/components/auth/portal-card";

export default function LoginPage() {
  return (
    <SplitLayout>
      <AuthWrapper>
        <PortalSelectionPage />
      </AuthWrapper>
    </SplitLayout>
  );
}
