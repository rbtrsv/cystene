import Sidebar from '@/modules/dashboard/components/categorised-savings/TailwindUI/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Sidebar>
      <div>{children}</div>
    </Sidebar>
  );
}
