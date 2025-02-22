import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Map from './pages/Map.jsx';
import AboutUs from './pages/AboutUs.jsx';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<Home />} />
				<Route path='/map' element={<Map />} />
				<Route path='/about' element={<AboutUs />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
