import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NodePage from "./pages/NodePage";

function App() {
  return (
    <Routes>
      <Route path="/" exact element={<HomePage />} />
      <Route path="/node/:nodeAddressOrName" exact element={<NodePage />} />
    </Routes>
  );
}

export default App;
