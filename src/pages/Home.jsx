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
    <div className="w-full min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-grow flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8">Welcome to Green Gauge</h1>
          <div className="w-full flex flex-col items-center">
            <img 
              src={forestImage} 
              className="w-full max-w-3xl h-auto object-cover rounded-lg shadow-lg"
              alt="Forest"
            />
            <div className="mt-8 p-6 bg-[--champagne] rounded-lg w-full max-w-3xl">
              <h2 className="text-2xl font-bold mb-4">Tree Coverage</h2>
              <p className="text-lg">
                It is recommended to have at least 30% tree coverage in every neighborhood to help mitigate the effects of urban heat islands. Trees provide shade, reduce temperatures, and improve air quality.
              </p>
            </div>
          </div>
        </div>
      </div>
      <BottomBar />
    </div>
  );
}
