import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/home-page";
import { Terms } from "./components/Terms";
import { Privacy } from "./components/Privacy";
import { Header } from "./components/Header";

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Header />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Router>
      <Footer />
    </div>
  );
}

export default App;
