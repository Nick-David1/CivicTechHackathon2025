/** @format */

import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config.json";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import BottomBar from "../components/BottomBar.jsx";

      
export default function Home() {
  const rootURL = config.serverRootURL;

  const navigate = useNavigate();

 

  return (
    <div>
      <NavBar />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold">Welcome to Green Guage</h1>
      </div>
    </div>
  );
}
