import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { withAuthInfo, useRedirectFunctions, useLogoutFunction } from "@propelauth/react";
import axios from "axios";
import config from "../../config.json";

const NavBar = withAuthInfo((props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const logoutFunction = useLogoutFunction();
  const { redirectToLoginPage, redirectToSignupPage, redirectToAccountPage } = useRedirectFunctions()

  const rootURL = config.serverRootURL;

  const isActive = (pathname) => {
    return location.pathname === pathname;
  };

  const home = () => {
    navigate("/");
  };

  const map = () => {
    navigate("/map");
  };



  const about = () => {
    navigate("/about");
  };

  return (
    <div>
        <div
            className={`fixed top-0 left-0 w-full bg-[--champagne] text-[--black] border-b-[3px] border-gray h-24 flex flex-row items-center justify-between z-10`}
        >
            <div className="flex items-center">
                <div onClick={home} className="px-4 cursor-pointer flex items-center">
                    <div className="font-bold text-[24pt] mx-1 h-full text-[--cambridge-blue] font-[snowfont]">
                        Green Gauge
                    </div>
                </div>
                <div className="font-Lato space-x-8 flex ml-8 font-bold text-lg">
                    <div onClick={map} className="px-4 cursor-pointer">
                        Map
                    </div>
                    <div onClick={about} className="px-4 cursor-pointer">
                        About Us
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-4 mr-8">
                {props.isLoggedIn ? 
                <button
                    className="px-6 py-3 rounded-md bg-[--cambridge-blue] hover:bg-[--khaki] outline-none font-bold text-white font-Lato"
                    type="button"
                    onClick={() => logoutFunction(true)}
                >
                    Logout
                </button>
                :
                <>
                    <button
                        className="px-6 py-3 rounded-md bg-[--cambridge-blue] hover:bg-[--khaki] outline-none font-bold text-white font-Lato"
                        type="button"
                        onClick={() => redirectToLoginPage()}
                    >
                        Login
                    </button>
                    <button
                        className="px-6 py-3 rounded-md bg-[--cambridge-blue] hover:bg-[--khaki] outline-none font-bold text-white font-Lato"
                        type="button"
                        onClick={() => redirectToSignupPage()}
                    >
                        Signup
                    </button>

                </> 

            }
            </div>
        </div>
        <div className="pt-24">
            {/* Your page content goes here */}
        </div>
    </div>
  );
});

export default NavBar;