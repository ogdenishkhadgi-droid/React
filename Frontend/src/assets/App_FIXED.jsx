import { useState, useEffect } from "react";
import { Hospital, Stethoscope, MapPin, Compass, Activity, Info } from 'lucide-react';
import "./App.css";
import bell from './assets/bell.png';

//Map imports
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';//Map UI
import 'leaflet/dist/leaflet.css';//leaflet css style
import L from 'leaflet';//Leaflet's underlying controller instance

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function App() {
    const [NodeCount, setNodeCount] = useState(1);
    const [ActiveTab , setActiveTab] = useState('login');
    const [Translate , setTranslate] = useState('bar');
    const [isMapSheetExpanded, setIsMapSheetExpanded] = useState(false);
    const [nearbyHospitals, setNearbyHospitals] = useState([]);
    const [loading, setLoading] = useState(false);

    const [mylocationLat , setMyLocationLat] = useState(27.7172);
    const [mylocationLng , setMyLocationLng] = useState(85.3240);

    //GPS error handling
    const [gpsError, setGpsError] = useState(null);
    const [apiError, setApiError] = useState(null);

    //Login Page:
    
    // ✅ FIXED: Added user state
    const [user, setUser] = useState(null);
    const [Gender, setGender] = useState('null');
    
    // ✅ FIXED: Changed login form to use username/password
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [isOnline, setIsOnline] = useState(!!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    //Auto login
    useEffect(() => {
        const savedToken = localStorage.getItem("userToken");
        const savedUserData = localStorage.getItem("userData");

        if (savedToken && savedUserData) {
            // ✅ FIXED: Changed JSON.deserialize to JSON.parse
            const userData = JSON.parse(savedUserData);
            setUser(userData);
            
            // ✅ NEW: Verify token is still valid
            verifyToken(savedToken);
        }
        setLoading(false);
    }, []);

    // ✅ NEW: Verify token endpoint
    const verifyToken = async (token) => {
        try {
            const response = await fetch(`http://localhost:8000/api/verify?token=${token}`);
            const data = await response.json();
            
            if (!data.valid) {
                // Token expired, clear storage
                handleLogout();
            }
        } catch (error) {
            console.error("Token verification failed:", error);
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("userToken");
        localStorage.removeItem("userData");
        setActiveTab('login');
    };

    // ✅ FIXED: Added proper dependency array
    useEffect(() => {
        if (user) {
            setActiveTab('home');
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    // ✅ FIXED: Updated to use correct endpoint and fields
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.username || !formData.password) {
            alert("Please enter username and password");
            return;
        }

        try {
            // ✅ FIXED: Changed endpoint to /api/login and method is correct
            const response = await fetch("http://localhost:8000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Save user data
                setUser(data.user); 
                
                // Save to localStorage for auto-login
                localStorage.setItem("userToken", data.access_token);
                localStorage.setItem("userData", JSON.stringify(data.user));
                
                // Clear form
                setFormData({ username: '', password: '' });
            } else {
                alert(data.error || data.detail || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Could not connect to the backend server.");
        }
    };

    const press_append = () => {
        if (NodeCount < 99) {
            setNodeCount(NodeCount + 1);
        } else {
            setNodeCount('+99');
        }
    };

    const Clearit = () => {
        setNodeCount(0);
    };

    // GPS Geolocation Hook
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsError("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setMyLocationLat(position.coords.latitude);
                setMyLocationLng(position.coords.longitude);
                setGpsError(null);
            },
            (err) => {
                const errorMessage = err.code === err.PERMISSION_DENIED 
                    ? "Please enable location permission to find nearby hospitals." 
                    : "Unable to get your location. Using default Kathmandu coordinates.";
                setGpsError(errorMessage);
                console.error("GPS Error:", err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,           
                maximumAge: 0,            
            }
        );
    }, []);

    // Fetch hospitals from Overpass API
    useEffect(() => {
        const fetchHospitalsInRadius = async () => {
            setLoading(true);
            setApiError(null);
            
            const query = `
                [out:json][timeout:15];
                (
                  node["amenity"="hospital"](around:1000,${mylocationLat},${mylocationLng});
                  way["amenity"="hospital"](around:1000,${mylocationLat},${mylocationLng});
                );
                out center 50; 
            `; 
            
            const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

            try {
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                // ... rest of hospital fetching logic
            } catch (error) {
                console.error("Error fetching hospitals:", error);
                setApiError("Failed to fetch nearby hospitals");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchHospitalsInRadius();
        }
    }, [mylocationLat, mylocationLng, user]);

    // ✅ FIXED: Show login page if not authenticated
    if (!user) {
        return (
            <div className="login-container">
                <h1>Health App</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit">Login</button>
                </form>
                <p>Demo - Username: demo, Password: password123</p>
            </div>
        );
    }

    // Main app content (shown after login)
    return (
        <div className="app-container">
            {/* Rest of your existing UI code */}
            {ActiveTab === 'home' && (
                <div className="main-container">
                    <h1>Welcome, {user.fullName}</h1>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            )}

            {/* ... other tabs ... */}
        </div>
    );
}

export default App;
