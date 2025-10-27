import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Editor from "@/pages/Editor";

// 获取基础路径，在生产环境中使用 GitHub Pages 的子路径
const basename = import.meta.env.PROD ? '/image-tools' : '';

export default function App() {
  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<Editor />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </Router>
  );
}
