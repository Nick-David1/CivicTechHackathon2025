import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

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

    setOriginalImage(base64Image);
    setImageURL(satelliteUrl);

    const analysisResponse = await axios.post(`${rootURL}/analyze`, {
      imageBase64: base64Image,
      lat: coordinates.lat,
      lng: coordinates.lng
    });

    setAnalysisResults(analysisResponse.data);
  } catch (error) {
    console.error("Error during analysis:", error);
    console.error("Error details:", error.response?.data);
    alert("Analysis failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

function someAsyncOperation() {
  somePromiseReturningFunction()
    .then(result => {
      // handle result
    })
    .catch(error => {
      if (error.code === 4001) {
        console.warn('User rejected the request.');
        // Handle the rejection gracefully (e.g., notify user)
      } else {
        console.error(error);
      }
    });
} 