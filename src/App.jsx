import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import LandingPage from "./pages/LandingPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Kombucha from "./pages/Kombucha.jsx";
import EcoEnzyme from "./pages/EcoEnzyme.jsx";
import FruitEnzyme from "./pages/FruitEnzyme.jsx";

// Bungkus tiap halaman dengan transisi fade + slide halus saat berpindah route.
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// useLocation butuh berada di dalam <BrowserRouter>, jadi routing dipisah
// ke komponen sendiri agar AnimatePresence bisa mendeteksi pergantian path.
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/kombucha" element={<PageTransition><Kombucha /></PageTransition>} />
        <Route path="/eco-enzyme" element={<PageTransition><EcoEnzyme /></PageTransition>} />
        <Route path="/fruit-enzyme" element={<PageTransition><FruitEnzyme /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;