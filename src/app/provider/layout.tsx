import { ProviderAuthProvider } from "@/lib/provider-auth-context";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <ProviderAuthProvider>{children}</ProviderAuthProvider>;
}
