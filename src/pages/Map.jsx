/** @format */

import config from "../../config.json";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import NavBar from "../components/NavBar.jsx";
import BottomBar from "../components/BottomBar.jsx";
import RadarMap from "../components/RadarMap.jsx";

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
    const [analyzedImage, setAnalyzedImage] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
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

    const handleLocationSelect = async (center) => {
        const newCoordinates = { lat: center[1], lng: center[0] };
        setCoordinates(newCoordinates);
        try {
            const response = await axios.get(`${rootURL}/getImage`, {
                params: {
                    lat: newCoordinates.lat,
                    long: newCoordinates.lng
                }
            });
            setImageURL(response.data.imageUrl);
            setGreenspacePercentage(response.data.greenspace_percentage);
            setAnalyzedImage(response.data.analyzed_image);
            setOriginalImage(response.data.original_image);
        } catch (error) {
            console.error("Error fetching image data:", error);
        }
    };

    // New function to analyze the image
    const handleAnalyze = async () => {
        if (!coordinates.lat || !coordinates.lng) return;
        setIsLoading(true);
        try {
            // Generate the satellite image URL using Mapbox Static API with a high zoom level for a close‐up view
            const zoomLevel = 18; // Adjust this level for focusing on a couple of blocks
            const width = 600;    // Width of the static image in pixels
            const height = 400;   // Height of the static image in pixels
            const satelliteUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${coordinates.lng},${coordinates.lat},${zoomLevel}/${width}x${height}?access_token=${mapboxgl.accessToken}`;

            // Send a POST request to the backend.
            // The backend should fetch and save the satellite image in MongoDB, 
            // then process the image via GPT Vision API and the tree detection model,
            // returning analysis results including the processed satellite image URL.
            const response = await axios.post(`${rootURL}/analyzeImage`, {
                lat: coordinates.lat,
                long: coordinates.lng,
                satelliteUrl: satelliteUrl
            });

            setAnalysisResults(response.data);
        } catch (error) {
            console.error("Error during analysis:", error);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col">
            <NavBar></NavBar>
            <div className="w-screen h-full bg-[--light-taupe-grey] overflow flex justify-center">
                <div className="rounded-md bg-[--champagne] p-20 space-y-2 w-auto h-full font-Lato my-4">
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
                                {/* New Analyze Button */}
                                <button 
                                    onClick={handleAnalyze}
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    {isLoading ? "Analyzing..." : "Analyze"}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="max-w-3xl mx-auto px-4">
                        {imageURL && (
                            <div className="mt-4">
                                <h3 className="text-xl font-semibold mb-2">Original Image</h3>
                                <img src={imageURL} alt="Original Map" className="w-full h-auto rounded-md" />
                            </div>
                        )}
                        <div className="flex flex-row space-x-4 mt-2 "> 
                            {originalImage && (
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Original Image</h3>
                                    <img 
                                        src={`data:image/png;base64,${originalImage}`} 
                                        alt="Analyzed Map" 
                                        className="w-full h-auto rounded-md" 
                                    />
                                </div>
                            )}
                            {analyzedImage && (
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Analyzed Image</h3>
                                    <img 
                                        src={`data:image/png;base64,${analyzedImage}`} 
                                        alt="Analyzed Map" 
                                        className="w-full h-auto rounded-md" 
                                    />
                                </div>
                            )}
                        </div>
                        {greenspacePercentage !== null && (
                            <div className="mt-4">
                             
                            </div>
                        )}
                        <div className="max-w-3xl mx-auto py-4 mt-2">
                            <h2 className="text-2xl font-bold mb-4">Tree Coverage</h2>
                            <p className="mb-2">
                                It is recommended to have at least 30% tree coverage in every neighborhood to help mitigate the effects of urban heat islands. Trees provide shade, reduce temperatures, and improve air quality.
                            </p>
                        </div>
                    </div>
                    {analysisResults && (
                        <div className="max-w-3xl mx-auto px-4">
                            {analysisResults.imageUrl && (
                                <div className="mt-4">
                                    <h3 className="text-xl font-semibold mb-2">Satellite Image</h3>
                                    <img src={analysisResults.imageUrl} alt="Satellite" className="w-full h-auto rounded-md" />
                                </div>
                            )}
                            {analysisResults.greenspace_percentage !== undefined && (
                                <div className="mt-4">
                                    <h3 className="text-xl font-semibold">Greenspace Percentage: {analysisResults.greenspace_percentage}%</h3>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <BottomBar />
        </div>
    );
}