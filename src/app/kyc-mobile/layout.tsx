export default function KycMobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] bg-[#080808] overflow-y-auto">
      {children}
    </div>
  );
}
