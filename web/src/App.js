import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NodePage from "./pages/NodePage";
import IntervalPage from "./pages/IntervalPage";

function App() {
  return (
    <Routes>
      <Route path="/" exact element={<HomePage />} />
      <Route path="/node/:nodeAddressOrName" exact element={<NodePage />} />
      <Route
        path="/interval/:rewardIndexOrOngoing"
        exact
        element={<IntervalPage />}
      />
    </Routes>
  );
}

export default App;
