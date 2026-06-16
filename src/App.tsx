import Header from "./Components/Header";

function App() {
  return (
    <>
      <Header
        username="Antonio"
        permissions={["tables", "kitchen", "config"]}
      />
    </>
  );
}

export default App;
