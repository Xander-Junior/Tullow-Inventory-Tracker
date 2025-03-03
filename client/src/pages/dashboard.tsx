import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useSearch } from "wouter";
import InventoryTable from "@/components/inventory-table";
import IssueForm from "@/components/issue-form";
import StatsCards from "@/components/stats-cards";
import { SiTidal } from "react-icons/si";
import { ClipboardList } from "lucide-react";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [search] = useSearch();
  const params = new URLSearchParams(search);
  const defaultTab = params.get('tab') || 'inventory';

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiTidal className="h-6 w-6" />
            <h1 className="text-xl font-bold">Tullow Ghana Inventory</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/logs">
              <Button variant="outline" size="sm">
                <ClipboardList className="h-4 w-4 mr-2" />
                View Logs
              </Button>
            </Link>
            <span className="text-sm text-gray-600">
              {user?.username} ({user?.department})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="issue">Issue/Return</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <InventoryTable />
          </TabsContent>

          <TabsContent value="issue">
            <IssueForm />
          </TabsContent>

          <TabsContent value="analytics">
            <StatsCards />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}