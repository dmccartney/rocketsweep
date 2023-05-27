import {BrowserRouter, HashRouter, Route, Routes} from "react-router-dom";
import HomePage from "./pages/HomePage";
import NodePage from "./pages/NodePage";
import IntervalPage from "./pages/IntervalPage";

function Router({children}) {
  if (process.env.REACT_APP_ROUTER === "hash") {
    return (
      <HashRouter>
        {children}
      </HashRouter>
    );
  }
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" exact element={<HomePage/>}/>
        <Route path="/node/:nodeAddressOrName" exact element={<NodePage/>}/>
        <Route
          path="/interval/:rewardIndexOrOngoing"
          exact
          element={<IntervalPage/>}
        />
      </Routes>
    </Router>
  );
}

export default App;
