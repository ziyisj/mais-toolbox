import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ImportPage from "./pages/ImportPage";
import ProductsPage from "./pages/ProductsPage";
import PublishPage from "./pages/PublishPage";
import SettingsPage from "./pages/SettingsPage";

export type PageKey = "import" | "products" | "publish" | "settings";

export default function App() {
  const [page, setPage] = useState<PageKey>("import");

  return (
    <div className="h-full flex">
      <Sidebar current={page} onChange={setPage} />
      <main className="flex-1 overflow-auto p-6">
        {page === "import" && <ImportPage />}
        {page === "products" && <ProductsPage />}
        {page === "publish" && <PublishPage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
