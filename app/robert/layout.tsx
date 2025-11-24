export default function RobertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {children}
    </div>
  );
}
