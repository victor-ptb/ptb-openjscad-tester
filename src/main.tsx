import React from "react";
import { render } from "react-dom";
import "./styles/index.css";
// import ReactJsCad from "./ReactJsCad";
import App from "./App";

const root = document.getElementById("root");
render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  root
);
