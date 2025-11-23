import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import About from "./components/About";

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/about" Component={About} />
      </Routes>
    </div>
  );
}

export default App;
