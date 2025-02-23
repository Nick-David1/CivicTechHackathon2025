/** @format */

import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config.json";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import BottomBar from "../components/BottomBar.jsx";
import forestImage from "../assets/forest.jpg";

      
export default function Home() {
  const rootURL = config.serverRootURL;

  const navigate = useNavigate();

 

  return (
    <div className="w-full h-screen flex">
      <NavBar />
      <div className="w-1/3 flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold">Welcome to Green Gauge</h1>
      </div>
      <div className="w-2/3 h-full flex justify-center">
        <img src={forestImage} className="w-full h-full object-cover"/>
      </div>
    </div>
  );
}
