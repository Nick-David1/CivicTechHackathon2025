/** @format */

import config from "../../config.json";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import NavBar from "../components/NavBar.jsx";
import BottomBar from "../components/BottomBar.jsx";

import axios from 'axios';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
/* Added import for Mapbox Geocoder CSS */
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// Initialize Mapbox
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Map() {
    const navigate = useNavigate();
    const rootURL = config.serverRootURL;
    const [greenspacePercentage, setGreenspacePercentage] = useState(null);
    const [address, setAddress] = useState("");
    const [location, setLocation] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [imageURL, setImageURL] = useState("");
    const [coordinates, setCoordinates] = useState({ lat: 42.3601, lng: -71.0589 });
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const geocoderContainerRef = useRef(null);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [coordinates.lng, coordinates.lat],
            zoom: 12
        });
        mapRef.current = map;

        // Instantiate Mapbox Geocoder and attach it to our custom container
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            marker: false,
            placeholder: 'Search for address'
        });
        geocoder.addTo(geocoderContainerRef.current);

        geocoder.on('result', (e) => {
            const { center, place_name } = e.result;
            setAddress(place_name);
            handleLocationSelect(center);
            if (mapRef.current) {
                mapRef.current.flyTo({ center: center, zoom: 16 });
            }
        });

        // Cleanup function: Remove the map and clear the geocoder container
        return () => {
            map.remove();
            if (geocoderContainerRef.current) {
                geocoderContainerRef.current.innerHTML = ''; // Clear the geocoder container
            }
        };
    }, []);

    const handleLocationSelect = (center) => {
        const newCoordinates = { lat: center[1], lng: center[0] };
        setCoordinates(newCoordinates);
        const zoomLevel = 18;
        const width = 600;
        const height = 400;
        const satelliteUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${newCoordinates.lng},${newCoordinates.lat},${zoomLevel}/${width}x${height}?access_token=${mapboxgl.accessToken}`;
        setImageURL(satelliteUrl);
    };

    // Function to analyze the image
    const handleAnalyze = async () => {
        if (!coordinates.lat || !coordinates.lng) return;
        setIsLoading(true);

        try {
            const zoomLevel = 18;
            const width = 600;
            const height = 400;
            const satelliteUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${coordinates.lng},${coordinates.lat},${zoomLevel}/${width}x${height}?access_token=${mapboxgl.accessToken}`;

            const response = await axios.get(satelliteUrl, { responseType: 'arraybuffer' });
            const base64Image = btoa(
                new Uint8Array(response.data).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    ''
                )
            );

            const analysisResponse = await axios.post(`${rootURL}/analyze`, {
                imageBase64: base64Image,
                lat: coordinates.lat,
                lng: coordinates.lng
            });

            // Remove the JSON parsing logic since Axios already parses the response
            const analysisResult = analysisResponse.data;

            setAnalysisResults(analysisResult);
            setImageURL(satelliteUrl);
        } catch (error) {
            console.error("Error during analysis:", error);
            alert("Analysis failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
        <NavBar></NavBar>
        <div className="w-screen flex-grow bg-[--light-taupe-grey] flex justify-center">
            <div className="rounded-md bg-[--champagne] p-8 space-y-2 w-full max-w-7xl font-Lato">
                    {/* Map Container */}
                    <div className="w-full h-96 bg-gray-200 flex items-center justify-center p-1 border border-gray-400">
                        <div ref={mapContainer} className="w-full h-full" />
                    </div>
                    <div className="max-w-3xl mx-auto px-4 py-4">
                        <h2 className="text-2xl font-bold mb-4">Check Your Coverage</h2>
                        <div className="mb-4">
                            <div ref={geocoderContainerRef} id="geocoder" className="w-full p-2" />
                        </div>
                        {address && (
                            <div className="mt-4">
                                <button 
                                    onClick={handleAnalyze}
                                    className="px-4 py-2 bg-green-600 text-white rounded flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Analyzing...
                                        </>
                                    ) : (
                                        "Analyze"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                    {analysisResults && (
                        <div className="max-w-3xl mx-auto px-4">
                            <div className="mt-4">
                                <h3 className="text-xl font-semibold mb-2">Satellite Image</h3>
                                <img src={imageURL} alt="Satellite View" className="w-full h-auto rounded-md" />
                                <div className="mt-4">
                                    <h3 className="text-xl font-semibold mb-2">Analysis Results</h3>
                                    <div className="bg-white p-4 rounded-md shadow space-y-4">
                                        {/* Tree Coverage Progress Bar */}
                                        <div>
                                            <p className="font-medium mb-2">Tree Coverage: {analysisResults.tree_cover_percent?.toFixed(2)}%</p>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div 
                                                    className="bg-green-600 h-2.5 rounded-full" 
                                                    style={{ width: `${analysisResults.tree_cover_percent}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Number of Trees */}
                                        <div>
                                            <p className="font-medium">Number of Trees: {analysisResults.num_trees}</p>
                                        </div>

                                        {/* Air Quality Details */}
                                        {analysisResults.air_quality && (
                                            <div className="space-y-2">
                                                <h4 className="text-lg font-semibold">Air Quality</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-sm">AQI (US):</p>
                                                        <p className="font-medium">{analysisResults.air_quality.current.pollution.aqius}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm">Main Pollutant:</p>
                                                        <p className="font-medium">{analysisResults.air_quality.current.pollution.mainus}</p>
                                                    </div>
                                                </div>
                                                <h4 className="text-lg font-semibold mt-4">Weather</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-sm">Temperature:</p>
                                                        <p className="font-medium">{analysisResults.air_quality.current.weather.tp}°C</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm">Humidity:</p>
                                                        <p className="font-medium">{analysisResults.air_quality.current.weather.hu}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm">Wind Speed:</p>
                                                        <p className="font-medium">{analysisResults.air_quality.current.weather.ws} m/s</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Add GPT Analysis Section */}
                                    {analysisResults.analysis && (
                                        <div className="mt-6">
                                            <h3 className="text-xl font-semibold mb-2">AI Environmental Recommendations</h3>
                                            <div className="bg-white p-4 rounded-md shadow">
                                                <p className="whitespace-pre-wrap text-gray-700">{analysisResults.analysis}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                   
                </div>
            </div>
            <BottomBar />
        </div>
    );
}