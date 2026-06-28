import { useState, useEffect } from "react";
import { Hospital, Stethoscope, MapPin, Compass, Activity, Info, Video, Lock } from 'lucide-react';
import "./App.css";
import bell from './assets/bell.png';

//Chatbot
import Chatbot from "./Chatbot.jsx";

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

    const [ActiveTab, setActiveTab] = useState(() => localStorage.getItem("userData") ? 'home' : 'login');

    const [Translate , setTranslate] = useState('bar');

    const [isMapSheetExpanded, setIsMapSheetExpanded] = useState(false);

    const [nearbyHospitals, setNearbyHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [guideSearchTerm, setGuideSearchTerm] = useState("");

    const [mylocationLat , setMyLocationLat] = useState(27.7172);
    const [mylocationLng , setMyLocationLng] = useState(85.3240);

    //GPS error handling
    const [gpsError, setGpsError] = useState(null);
    const [apiError, setApiError] = useState(null);

    //Login Page:
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("userData");
        return saved ? JSON.parse(saved) : null;
    });
    const [Prem ,setPrem] = useState(false);
    const [Login, setLogin] = useState(() => !!localStorage.getItem("userData"));
    const [Auto , setAuto] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        address: '',
        phone: '',
        gender: ''
    });
    const [isOnline, setIsOnline] = useState(!!navigator.onLine);

    //specialists
    const [specialistSearch, setSpecialistSearch] = useState("");
    const dummySpecialists = [
    {
        id: 1,
        name: "Dr. Ram Shrestha (Cardiologist)",
        hospital: "Tribhuvan University Teaching Hospital (TUTH)",
        fields: ["Heart Care", "Cardiology", "ECG"]
    },
    {
        id: 2,
        name: "Dr. Sita Thapa (Pediatrician)",
        hospital: "Kanti Children's Hospital",
        fields: ["Child Health", "Pediatrics", "Vaccination"]
    },
    {
    id: 3,
    name: "Dr. Bhagawan Koirala (Cardiothoracic Surgeon)",
    hospital: "Manmohan Cardiothoracic Vascular and Transplant Center",
    fields: ["Heart Surgery", "Cardiothoracic", "Valve Replacement"]
    },
    {
    id: 4,
    name: "Dr. Sanduk Ruit (Ophthalmologist)",
    hospital: "Tilganga Institute of Ophthalmology",
    fields: ["Eye Care", "Cataract Surgery", "Ophthalmology"]
    },
    {
    id: 5,
    name: "Dr. Govinda KC (Orthopedic Surgeon)",
    hospital: "Tribhuvan University Teaching Hospital (TUTH)",
    fields: ["Bone & Joint", "Orthopedics", "Trauma Care"]
    },
    {
    id: 6,
    name: "Dr. Aruna Uprety (Public Health & Nutrition Specialist)",
    hospital: "Nutritious Food Nepal Initiative",
    fields: ["Women's Health", "Nutrition", "Community Medicine"]
    },
    {
    id: 7,
    name: "Dr. Pukar Chandra Shrestha (Transplant Surgeon)",
    hospital: "Human Organ Transplant Center (Shahid Dharma Bhakta Hospital)",
    fields: ["Kidney Transplant", "Liver Specialist", "Urology"]
    },
    {
    id: 8,
    name: "Dr. Jaganath Sharma (Neurologist)",
    hospital: "Upendra Devkota Memorial National Institute of Neurological Allied Sciences",
    fields: ["Brain & Spine", "Neurology", "Stroke Management"]
    }
    ];

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
    const savedUserData = localStorage.getItem("userData");

    // if (savedUserData) {
    //   // Automatically log them in without making them re-type credentials
    //   setUser(JSON.parse(savedUserData));
    // }
    setLoading(false);
    }, []);


    const handleLogout = () => { //Handle Logout
        setLogin(false);    
        setUser(null);
        setActiveTab('login');
        localStorage.removeItem("userData");
        setFormData({
        fullName: '',
        address: '',
        phone: '',
        gender: ''
    });
    };


    const handleChange = (e) =>{
        const { name, value } = e.target;
            setFormData((prevData) => ({
        ...prevData,
        [name]: value
        }));
    };


    const handleSubmit = async (e) => {
     e.preventDefault();
        try {
        const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (response.ok) {
        setUser(data.user);
        localStorage.setItem("userData", JSON.stringify(data.user));
        setLogin(true); 
        setActiveTab('home'); 
        setAuto(true)
        } else {
        alert(data.detail || "Login failed");
        }
    } catch (error) {
        alert("Could not connect to the backend server.");
    }
    }

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
                    setGpsError(null); // Clear error on success
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

    const quickTipsList = [
        "खाना खानुअघि साबुनपानीले राम्रोसँग हात धुनुहोस्।",
        "दिनमा कम्तीमा ३ देखि ४ लिटर सफा वा उमालेको पानी पिउनुहोस्।",
        "घर बाहिर निस्कँदा धुलो र प्रदूषणबाट बच्न मास्कको प्रयोग गर्नुहोस्।",
        "बासी, खुला वा सडक किनारका असुरक्षित खानेकुराहरू नखानुहोस्।",
        "प्रत्येक दिन कम्तीमा २०-३० मिनेट हल्का शारीरिक व्यायाम वा हिँडडुल गर्नुहोस्।",
        "आफ्नो खानपानमा हरियो सागसब्जी र ताजा फलफूलहरू नियमित समावेश गर्नुहोस्।",
        "बिना डाक्टरको सल्लाह एन्टिबायोटिक वा अन्य औषधिहरू मनपरी नखानुहोस्।",
        "लामखुट्टेको टोकाइबाट बच्न घर वरपर पानी जम्न नदिनुहोस्।"
    ];

   
    const [randomTips, setRandomTips] = useState([]);

    
    useEffect(() => {
        const shuffled = [...quickTipsList].sort(() => 0.5 - Math.random());
        setRandomTips(shuffled.slice(0, 1));
    }, []);

    // Fetch hospitals from Overpass API
    useEffect(() => {
        const fetchHospitalsInRadius = async () => {
            setLoading(true);
            setApiError(null); // Clear previous errors
            
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
                
                // Null safety check for elements array
                if (!data.elements || !Array.isArray(data.elements)) {
                    setNearbyHospitals([]);
                    setApiError("No hospital data received from server.");
                    setLoading(false);
                    return;
                }

                // Filter out hospitals with invalid coordinates
                const formattedHospitals = data.elements
                    .map((element, index) => {
                        const hospitalLat = element.lat || (element.center && element.center.lat);
                        const hospitalLng = element.lon || (element.center && element.center.lon);
                        
                        // Skip if coordinates are missing
                        if (hospitalLat === undefined || hospitalLng === undefined) {
                            return null;
                        }
                        
                        return {
                            id: element.id || index,
                            name: element.tags?.name || "अस्पताल (Hospital)",
                            address: element.tags?.["addr:street"] || "Nearby",
                            phone: element.tags?.phone || element.tags?.["contact:phone"] || "102", 
                            location: [hospitalLat, hospitalLng]
                        };
                    })
                    .filter(hospital => hospital !== null); // Remove invalid entries

                setNearbyHospitals(formattedHospitals);
                
                // Show message if no hospitals found
                if (formattedHospitals.length === 0) {
                    setApiError("No hospitals found in your area.");
                }
                
            } catch (error) {
                console.error("Error fetching hospitals:", error);
                setApiError("Failed to load nearby hospitals. Please try again later.");
                setNearbyHospitals([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHospitalsInRadius();
    }, [mylocationLat, mylocationLng]); 

    // fitness tracker
    const [steps, setSteps] = useState(3000);
    const [isTracking, setIsTracking] = useState(false);
    const calories = Math.round(steps * 0.04);
    const distance = (steps * 0.00075).toFixed(2);
    const activeMinutes = Math.floor(steps / 100);
    const co2Saved = Math.round(steps * 0.00075 * 192);

    const statsData = [
        { 
            icon: '🔥', 
            label: 'क्यालोरी (Calories)', 
            value: calories,
            unit: 'kcal',
            gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E72 100%)',
            accentColor: '#FF6B6B'
        },
        { 
            icon: '🗺️', 
            label: 'दुरी (Distance)', 
            value: distance,
            unit: 'km',
            gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
            accentColor: '#4ECDC4'
        }
    ];

    useEffect(() => {
        if (!isTracking) return;

        let lastAcceleration = { x: 0, y: 0, z: 0 };
        const threshold = 12; // Adjust sensitivity value based on testing

        const handleMotion = (event) => {
            const acc = event.accelerationIncludingGravity;
            if (!acc) return;

            // Calculate magnitude change (Delta)
            const deltaX = Math.abs(acc.x - lastAcceleration.x);
            const deltaY = Math.abs(acc.y - lastAcceleration.y);
            const deltaZ = Math.abs(acc.z - lastAcceleration.z);

            // If structural acceleration shifts rapidly past the threshold, register a step
            if ((deltaX + deltaY + deltaZ) > threshold) {
                setSteps(prev => prev + 1);
            }

            lastAcceleration = { x: acc.x, y: acc.y, z: acc.z };
        };

        window.addEventListener("devicemotion", handleMotion);
        return () => window.removeEventListener("devicemotion", handleMotion);
    }, [isTracking, setSteps]);
    //Save steps
    useEffect(() => {
        if (steps > 0) {
            localStorage.setItem("saved_today_steps", steps.toString());
        }
    }, [steps]);


    //Notification:
    const [notifications, setNotifications] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);


    // Pull notifications from API when ActiveTab shifts to 'notify'
    useEffect(() => {
        if (ActiveTab !== 'notify') return;

        const fetchNotifications = async () => {
            setNotifLoading(true);
            try {
                const response = await fetch("http://localhost:8000/api/notifications");
                const data = await response.json();
                if (response.ok) {
                    setNotifications(data.notifications);
                } else {
                    console.error("Failed to fetch notifications:", data.detail);
                }
            } catch (error) {
                console.error("Error communicating with notification engine:", error);
            } finally {
                setNotifLoading(false);
            }
        };

        fetchNotifications();
    }, [ActiveTab]);

    
    return (
        <div className="app_contain">
            {/* Map pre render */}
        <div 
            className="screen-wrapper map"
            style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                zIndex: ActiveTab === 'Locate' ? 1005 : -1, 
                opacity: ActiveTab === 'Locate' ? 1 : 0,    
                pointerEvents: ActiveTab === 'Locate' ? 'auto' : 'none' // Disables interaction when hidden
            }}
        >
            <header className="floating-header">
                <button className="back-btn" onClick={() => setActiveTab('home')} onTouchStart={() => setActiveTab('home')}>← Back</button>
                <div className="header-title">नजिकैका अस्पतालहरू</div>
            </header>

            <div className="map-viewport-canvas" style={{ height: "100%", width: "100%" }}>
                
                <MapContainer 
                    center={[mylocationLat, mylocationLng]} 
                    zoom={15} 
                    zoomControl={false}        
                    style={{ height: "100%", width: "100%" }}
                    
                    whenReady={(mapInstance) => {
                        // Instantly checks map bounding layers when tab changes
                        setTimeout(() => {
                            mapInstance.target.invalidateSize();
                        }, 100);
                    }}
                >
                    

                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {nearbyHospitals.map((hospital) => (
                        <Marker key={hospital.id} position={hospital.location}>
                            <Popup>
                                <strong>{hospital.name}</strong> <br />
                                {hospital.address} <br />
                                <a href={`tel:${hospital.phone.split(',')[0].trim()}`} style={{color: '#0f6d5a', fontWeight: 'bold'}}>
                                    📞 Call
                                </a>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            
            <div className={`bottom-sheet ${isMapSheetExpanded ? 'expanded' : ''}`} style={{ bottom: '0px' }}> 
                <div 
                    className="sheet-interactive-header" 
                    onClick={() => setIsMapSheetExpanded(!isMapSheetExpanded)}
                    onTouchStart={() => setIsMapSheetExpanded(!isMapSheetExpanded)}
                >
                    <div className="sheet-drag-handle"></div>
                    <div className="sheet-header-group">
                        <h3 className="radius-title">अस्पताल निर्देशिका</h3>
                        <p className="radius-subtitle">
                            {isMapSheetExpanded ? 'तल झार्न थिच्नुहोस्' : 'माथि तान्न थिच्नुहोस्'}
                        </p>
                    </div>
                </div>
                
                <div className="sheet-content-container">
                    <div className="hospital-scroll-list">
                        {gpsError && (
                            <div style={{ textAlign: 'center', padding: '15px', color: '#d9534f', backgroundColor: '#f2dede', borderRadius: '4px', margin: '10px' }}>
                                ⚠️ {gpsError}
                            </div>
                        )}
                        
                        {apiError && !loading && (
                            <div style={{ textAlign: 'center', padding: '15px', color: '#d9534f', backgroundColor: '#f2dede', borderRadius: '4px', margin: '10px' }}>
                                ⚠️ {apiError}
                            </div>
                        )}
                        
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>खोज्दै...</div>
                        ) : (
                            
                            nearbyHospitals.map((hospital) => {
                                const cleanPhone = hospital.phone.split(',')[0].trim();
                                return (
                                    <div className="hospital-card-item" key={hospital.id}>
                                        <div className="hosp-info">
                                            <h4>{hospital.name}</h4>
                                            <p>{hospital.address}</p>
                                        </div>
                                        
                                        <a href={`tel:${cleanPhone}`} className="hosp-call-action">
                                            📞 Call
                                        </a>
                                    </div>
                                );
                            })
                        )}

                        {!loading && nearbyHospitals.length === 0 && !apiError && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>कुनै अस्पताल भेटिएन।</div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {['home', 'record', 'account'].includes(ActiveTab) && (
            <header className="navigation-bar-top">
                <div className="header-text">
                    <h1 className="title">Medi Sewa Nepal</h1>
                    <p className="dis">तपाईंको आफ्नै घरको चिकित्सा सेवा</p>
                </div>
                <div className="notification-container">
                    <button className="notify-but" onClick={Clearit} onTouchStart={Clearit}>
                        <img src={bell} className="bell" alt="Notifications"  onClick={() => {setActiveTab('notify')}}/>
                    </button>
                    {NodeCount > 0 && <div className="badge">{NodeCount}</div>}
                </div>
            </header>
        )}
            

            {ActiveTab === 'login' && isOnline && (
                <div className="main-container">
                    <div className="header-text ">
                    <h1 className="title formt">Medi Sewa Nepal</h1>
                    <p className="dis formd">तपाईंको आफ्नै घरको चिकित्सा सेवा</p>
                </div>
                    <div className="form-container">
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
                            <label>
                                <b>Full Name (पूरा नाम) :</b>
                                <input
                                name="fullName"
                                 className="input"
                                 value={formData.fullName}
                                 onChange={handleChange}
                                 required
                                />
                            </label>
                            <label>
                                <b>Your Address (ठेगाना):</b>
                                <input
                                name="address"
                                 className="input"
                                 value={formData.address}
                                 onChange={handleChange}
                                 required
                                />
                            </label>

                            <label>
                                <b>Phone No (फोन नम्बर)</b>
                                <input
                                className="input"
                                type="number"
                                name="phone"
                                placeholder="कृपया आफ्नो फोन नम्बर प्रयोग गर्नुहोस्।"
                                onChange={handleChange}
                                value={formData.phone}
                                required
                                >
                                
                                </input>
                            </label>

                            <label>
                                
                                <b>Gender (लिङ्ग)</b><br />
                                <button 
                                    type="button"
                                    className={`gender ${formData.gender === "male" ? "m" : ""}`}
                                    onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                                >
                                    Male
                                </button>

                                <button 
                                    type="button"
                                    className={`gender ${formData.gender === "female" ? "f" : ""}`}
                                    onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                                >
                                    Female
                                </button>
                            </label>

                            <button type="submit" className="submit">Submit</button>
                             {/* <pre>{JSON.stringify(formData, null, 2)}</pre> */}
                        </form>
                    </div>
                </div>

            )}
            
            
            
            { ActiveTab === 'home' && (<div className="main-container">
            <div className="clickable"> 
                <a href="tel:102" className="href">
                <button className="but animate-pop-up delay-1">
                    <Hospital size={28} color="#ffffff" className="hospital-icon"/>
                    <div className="btn-text-group">
                        <h1 className="title1">Emergency Sewa</h1> 
                        <p className="dis1">आपतकालीन सेवा</p>
                    </div>
                </button>
                </a>
            </div>

                <br />
                <div className="grid-container">
                   <div className="clickable"> 
                        <button className="node-but animate-pop-up delay-2 " onClick={() => setActiveTab('Specialist')} onTouchStart={() => setActiveTab('Specialist')}>
                            <Stethoscope size={32} className="node-icon clinic-color" />
                            <span className="node-title">Specialists</span>
                            <span className="node-title-nep">विशेषज्ञ</span>
                        </button>
                    </div>

                    <div className="clickable">
                        <button className="node-but animate-pop-up delay-3" onClick={() => setActiveTab('Locate')} onTouchStart={() => setActiveTab('Locate')}>
                            <MapPin size={32} className="node-icon map-color" />
                            <span className="node-title">Nearby</span>
                            <span className="node-title-nep">नजिकै</span>
                        </button>
                    </div>

                    <div className="clickable">
                        <button className="node-but animate-pop-up delay-4" onClick={() => setActiveTab('Guide')} onTouchStart={() => setActiveTab('Guide')}>
                            <Compass size={32} className="node-icon guide-color" />
                            <span className="node-title">Guide</span>
                            <span className="node-title-nep">निर्देशन</span>
                        </button>
                    </div>

                    <div className="clickable">
                        <button className="node-but animate-pop-up delay-5" onClick={()=> setActiveTab('Symptoms')} onTouchStart={()=> setActiveTab('Symptoms')}>
                            <Activity size={32} className="node-icon symptom-color" />
                            <span className="node-title">Symptoms</span>
                            <span className="node-title-nep">लक्षणहरू</span>
                        </button>
                    </div>

                </div>

                <br />
                <div>
                    <div className="clickable">
                        <button className="node-but animate-pop-up delay-6"><div>
                        <ul typeof="none" className="qtip-head"> 
                            <h3 className="qtip-title">
                                <Info size={24} color="#0f6d5a" className="info-icon" />
                                द्रुत सुझावहरू
                            </h3>
                            <ul typeof="disc">
                                {randomTips.map((tipText, index) => (
                                <li key={index} className="qtip-body">
                                    <p>{tipText}</p>  
                                </li>
                            ))}
                            </ul>
                        </ul>    

                        <br />   
                            
                        </div></button>
                    </div>
                    <br />
                    <div className="clickable">
                        <button className="node-but animate-pop-up delay-6"><div>
                        <ul typeof="none" className="qtip-head"> 
                            <h3 className="qtip-title"><Info size={24} color="#0f6d5a" className="info-icon" />द्रुत सुझावहरू</h3>
                            <ul typeof="disc">
                                <li className="qtip-body">
                                    <p>खाना खानुअघि हात धुनुहोस्।</p>  
                                </li>
                            </ul>
                        </ul>    
                            
                            
                        </div></button>
                    </div>
                </div>
                </div>)}


                {ActiveTab === 'record' && (
                    <div className="hide-scrollbar" style={{ 
                        padding: "24px 20px 100px 20px", 
                        color: "#2c3e50",                 
                        background: "#e7edea",       
                                  
                        height: "calc(100vh - 80px)",
                        marginTop: "58px",
                        overflowY: "auto",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none" 
                    }}>

                        {/* Main Steps Card - Changed from dark gradient to crisp dashboard white */}
                        <div className="animate-pop-up delay-1" style={{
                            background: "#ffffff",
                            padding: "24px",
                            borderRadius: "24px",
                            marginBottom: "20px",
                            border: "white solid 1px",
                            boxShadow: "0 10px 5px rgba(0, 0, 0, 0.04)", 
                            textAlign: "center"
                        }}>
                            <span style={{ fontSize: "13px", color: "#106017", display: "block", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                आजको पैदल यात्रा (Today's Steps)
                            </span>
                            
                            <h1 style={{ 
                                fontSize: "52px", 
                                margin: "0 0 4px 0", 
                                fontWeight: "800",
                                color: "#0f6d5a" /* Tied directly to your core brand teal color */
                            }}>
                                {steps.toLocaleString()}
                            </h1>
                            
                            <span style={{ fontSize: "14px", color: "#0a6405", marginBottom: "16px", display: "block", fontWeight: "500" }}>
                                / १०,००० लक्ष्य
                            </span>
                            
                            {/* Circular Progress Indicator recolored for light mode */}
                            <div className="animate-pop-up delay-3" style={{
                                width: "180px",
                                height: "180px",
                                margin: "16px auto",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <svg width="180" height="180" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
                                    <circle
                                        cx="90"
                                        cy="90"
                                        r="80"
                                        fill="none"
                                        stroke="#4ccb7b"
                                        strokeWidth="10"
                                    />
                                    <circle
                                        cx="90"
                                        cy="90"
                                        r="80"
                                        fill="none"
                                        stroke="url(#progressGradient)"
                                        strokeWidth="10"
                                        strokeDasharray={`${(steps / 10000) * 502.4} 502.4`}
                                        strokeLinecap="round"
                                        style={{ transition: "stroke-dasharray 0.5s ease" }}
                                    />
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#128a72" />
                                            <stop offset="100%" stopColor="#0f6d5a" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div style={{ textAlign: "center", zIndex: 1 }}>
                                    <div style={{ fontSize: "32px", fontWeight: "700", color: "#0c5c3b" }}>
                                        {Math.min(Math.round((steps / 10000) * 100), 100)}%
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#112950", fontWeight: "500" }}>सम्पन्न</div>
                                </div>
                            </div>

                            {/* Linear Progress Track bar */}
                            <div style={{ 
                                width: "100%", 
                                height: "8px", 
                                background: "#3bd469", 
                                borderRadius: "10px", 
                                overflow: "hidden", 
                                margin: "24px 0" 
                            }}>
                                <div style={{ 
                                    width: `${Math.min((steps / 10000) * 100, 100)}%`, 
                                    height: "100%", 
                                    background: "#0b6956",
                                    transition: "width 0.3s ease" 
                                }}></div>
                            </div>

                            {/* Recolored Interactive Action Button to fit image style */}
                            <button 
                                onClick={() => {
                                    if (!isTracking) {
                                        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                                            DeviceMotionEvent.requestPermission()
                                                .then(permissionState => {
                                                    if (permissionState === 'granted') {
                                                        setIsTracking(true);
                                                    }
                                                })
                                                .catch(console.error);
                                        } else {
                                            setIsTracking(true);
                                        }
                                    } else {
                                        setIsTracking(false);
                                    }
                                }}
                                style={{
                                    background: isTracking 
                                        ? "#e53e3e"  /* Red accent similar to Emergency Banner */
                                        : "#0f6d5a", /* Standard cohesive teal action button color */
                                    border: "none",
                                    color: "#fff",
                                    padding: "14px 32px",
                                    borderRadius: "16px",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 4px 12px rgba(15, 109, 90, 0.15)",
                                    letterSpacing: "0.3px"
                                }}
                            >
                                {isTracking ? "⏹️ ट्र्याकिङ बन्द गर्नुहोस्" : "▶️ ट्र्याकिङ सुरु गर्नुहोस्"}
                            </button>
                        </div>

                        {/* Recolored Stats Grid (Calories and Distance) */}
                        <div className="animate-pop-up delay-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            {[
                                { icon: '🔥', label: 'क्यालोरी (Calories)', value: calories, unit: 'kcal', borderColor: '#1a1111', iconBg: '#fff5f5' },
                                { icon: '🗺️', label: 'दुरी (Distance)', value: distance, unit: 'km', borderColor: '#b2f5ea', iconBg: '#e6fffa' }
                            ].map((stat, idx) => (
                                <div 
                                    key={idx}
                                    style={{
                                        background: "#ffe884",
                                        padding: "16px",
                                        borderRadius: "20px",
                                        boxShadow: "0 10px 5px rgba(0, 0, 0, 0.04)", 
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                        <span style={{ fontSize: "13px", color: "#4a5568", fontWeight: "600" ,}}>{stat.label}</span>
                                        <div style={{ background: stat.iconBg, padding: "6px", borderRadius: "10px", fontSize: "18px" ,}}>{stat.icon}</div>
                                    </div>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: "24px", 
                                        fontWeight: "700",
                                        color: "#2c3e50"
                                        
                                    }}>
                                        {stat.value}
                                        <span style={{ fontSize: "13px", color: "#718096", marginLeft: "4px", fontWeight: "500" }}>
                                            {stat.unit}
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Progress Metrics Section */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", }}>
                            
                            {/* Active Time Card */}
                            <div className="animate-pop-up delay-3" style={{
                                background: "#ffffff",
                                padding: "18px",
                                borderRadius: "20px",
                                border: "white solid 1px",
                                boxShadow: "0 10px 5px rgba(0, 0, 0, 0.04)", 
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#4a5568" }}>⏱️ सक्रिय समय (Active Time)</span>
                                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#6b46c1" }}>
                                        {activeMinutes} / १०० min
                                    </span>
                                </div>
                                <div style={{ width: "100%", height: "8px", background: "#6e3ebd", borderRadius: "10px", overflow: "hidden" }}>
                                    <div style={{ 
                                        width: `${Math.min((activeMinutes / 100) * 100, 100)}%`, 
                                        height: "100%", 
                                        background: "#250869",
                                        transition: "width 0.4s ease" 
                                    }} />
                                </div>
                            </div>

                            {/* CO2 Offset Card */}
                            <div style={{
                                background: "#ffffff",
                                padding: "18px",
                                borderRadius: "20px",
                                border: "white solid 1px",
                                boxShadow: "0 10px 5px rgba(0, 0, 0, 0.04)", 
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#0c5405" }}>🌱 पर्यावरण योगदान (CO₂ Saved)</span>
                                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#2f855a" }}>
                                        {co2Saved} / १४४० g
                                    </span>
                                </div>
                                <div style={{ width: "100%", height: "8px", background: "#16e048", borderRadius: "10px", overflow: "hidden" }}>
                                    <div style={{ 
                                        width: `${Math.min((co2Saved / 1440) * 100, 100)}%`, 
                                        height: "100%", 
                                        background: "#2f855a",
                                        transition: "width 0.4s ease" 
                                    }} />
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {ActiveTab === 'account' && (
                    <div className="hide-scrollbar" style={{ 
                        padding: "24px 20px 100px 20px", 
                        color: "#2c3e50",                      /* Dark slate text */
                        background: "#f4f7f6",                 /* Matches light app background canvas */
                        height: "calc(100vh - 80px)",
                        marginTop: "80px",
                        overflowY: "auto",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none" 
                    }}>
                        <div className="account-profile-card animate-pop-up" style={{
                            background: "#ffffff",
                            padding: "24px",
                            borderRadius: "24px",
                            marginBottom: "20px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)" /* Crisp light-mode shadow */
                        }}>
                            <h2 className="section-heading" style={{ 
                                margin: "0 0 20px 0", 
                                fontSize: "20px", 
                                fontWeight: "700", 
                                color: "#0f6d5a",                      /* Core brand teal accent */
                                borderBottom: "2px solid #edf2f7",
                                paddingBottom: "12px"
                            }}>
                                👤 प्रयोगकर्ता प्रोफाइल (Profile)
                            </h2>
                            
                            {user ? (
                                <div className="profile-details-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '10px 0' }}>
                                    
                                    {[
                                        { label: "पूरा नाम (Name)", value: user.fullName || formData.fullName },
                                        { label: "ठेगाना (Address)", value: user.address || formData.address },
                                        { label: "फोन नम्बर (Phone)", value: user.phone || formData.phone }
                                    ].map((field, idx) => (
                                        <div className="profile-field" key={idx} style={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            gap: "4px",
                                            background: "#f8fafc",
                                            padding: "12px 16px",
                                            borderRadius: "14px",
                                            border: "1px solid #edf2f7"
                                        }}>
                                            <strong style={{ fontSize: "12px", color: "#718096", fontWeight: "600", textTransform: "uppercase" }}>
                                                {field.label}
                                            </strong>
                                            <span style={{ fontSize: "16px", color: "#2c3e50", fontWeight: "500" }}>
                                                {field.value}
                                            </span>
                                        </div>
                                    ))}

                                    {formData.gender && (
                                        <div className="profile-field" style={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            gap: "4px",
                                            background: "#f8fafc",
                                            padding: "12px 16px",
                                            borderRadius: "14px",
                                            border: "1px solid #edf2f7"
                                        }}>
                                            <strong style={{ fontSize: "12px", color: "#718096", fontWeight: "600", textTransform: "uppercase" }}>
                                                लिङ्ग (Gender)
                                            </strong>
                                            <span style={{ fontSize: "16px", color: "#2c3e50", fontWeight: "500", textTransform: 'capitalize' }}>
                                                {formData.gender}
                                            </span>
                                        </div>
                                    )}

                                    <div className="profile-field" style={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            gap: "4px",
                                            background: "#f8fafc",
                                            padding: "12px 16px",
                                            borderRadius: "14px",
                                            border: "1px solid #edf2f7"
                                        }}>
                                            <strong style={{ fontSize: "12px", color: "#718096", fontWeight: "600", textTransform: "uppercase" }}>
                                                Set Premium Account
                                            </strong>
                                            <span style={{ fontSize: "16px", color: "#2c3e50", fontWeight: "500", textTransform: 'capitalize' }}>
                                                <button 
                                                className={`butt1 ${Prem ? "green" : ""}`}
                                                onClick={()=> {setPrem(true)}}
                                                >
                                                    Activate
                                                </button>
                                            </span>
                                        </div>
                                    
                                    <button 
                                        type="button" 
                                        className="submit logout-btn" 
                                        style={{ 
                                            marginTop: '12px', 
                                            backgroundColor: '#e53e3e',  
                                            height: "55px",      /* Clean crimson-red logout action button */
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '14px',
                                            borderRadius: '16px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(229, 62, 62, 0.15)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={handleLogout}
                                        onTouchStart={handleLogout}
                                    >
                                        Log Out (बाहिर निस्कनुहोस्)
                                    </button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#718096' }}>
                                    <p style={{ margin: "0 0 20px 0", fontSize: "15px", fontWeight: "500" }}>
                                        कुनै विवरण फेला परेन। कृपया पहिले लगइन गर्नुहोस्।
                                    </p>
                                    <button 
                                        className="submit" 
                                        style={{
                                            background: "#0f6d5a",
                                            border: "none",
                                            color: "#fff",
                                            padding: "12px 28px",
                                            borderRadius: "14px",
                                            fontSize: "15px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            boxShadow: "0 4px 12px rgba(15, 109, 90, 0.15)"
                                        }}
                                        onClick={() => setActiveTab('login')}
                                    >
                                        Go to Login
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
              

                {ActiveTab === 'Specialist' && (
                    <div className="screen-wrapper specialist" style={{ background: "#f4f7f6", height: "100vh" }}>
                        <header className="floating-header">
                            <button className="back-btn" onClick={() => setActiveTab('home')} onTouchStart={() => setActiveTab('home')}>← Back</button>
                            <div className="header-title" style={{ color: "#0f6d5a" }}>विशेषज्ञ (Specialists)</div>
                        </header>

                        <div className="specialist-content-scroll" style={{
                            marginTop: "85px",
                            height: "calc(100vh - 170px)",
                            overflowY: "auto",
                            padding: "0 20px",
                            scrollbarWidth: "none"
                        }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "40px" }}>
                                {dummySpecialists.map((spec) => (
                                    <div key={spec.id} className="animate-pop-up" style={{
                                        background: "#ffffff",
                                        padding: "18px",
                                        borderRadius: "20px",
                                        border: "1px solid #edf2f7",
                                        boxShadow: "0 10px 5px rgba(0, 0, 0, 0.02)"
                                    }}>
                                        <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#2c3e50", fontWeight: "700" }}>
                                            {spec.name}
                                        </h3>
                                        <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#718096", fontWeight: "500" }}>
                                            🏥 {spec.hospital}
                                        </p>
                                        
                                        {/* Specialist Field In (Mapping Lists) */}
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                                            {spec.fields.map((field, fIdx) => (
                                                <span key={fIdx} style={{
                                                    background: "#e6fffa",
                                                    color: "#0f6d5a",
                                                    fontSize: "12px",
                                                    padding: "4px 10px",
                                                    borderRadius: "20px",
                                                    fontWeight: "600",
                                                    border: "1px solid #b2f5ea"
                                                }}>
                                                    {field}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Premium Conditional Zoom Login Display */}
                                        {Prem ? (
                                            <button style={{
                                                width: "100%",
                                                background: "#2d8cff", // Zoom Blue
                                                border: "none",
                                                color: "#ffffff",
                                                padding: "12px",
                                                borderRadius: "14px",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "8px",
                                                boxShadow: "0 4px 12px rgba(45, 140, 255, 0.25)"
                                            }} onClick={() => alert(`Launching Zoom call with ${spec.name}...`)}>
                                                <Video size={18} />
                                                Zoom Login & Consultation
                                            </button>
                                        ) : (
                                            <div style={{
                                                width: "100%",
                                                background: "#fff5f5",
                                                border: "1px dashed #feb2b2",
                                                color: "#c53030",
                                                padding: "12px",
                                                borderRadius: "14px",
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "8px"
                                            }}>
                                                <Lock size={16} />
                                                Access premium to proceed
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {ActiveTab === 'Locate' && (
                    <div className="screen-wrapper map">
                        
                    </div> 
                )}

                {ActiveTab === 'Guide' && (
                    <div className="screen-wrapper specialist">
                    <header className="floating-header">
                        <button className="back-btn" onClick={() => setActiveTab('home')} onTouchStart={() => setActiveTab('home')}>← Back</button>
                        <div className="header-title">निर्देशन (Guide)</div>
                    </header>

                    <div className="guide-content-scroll" style={{
                        marginTop: "85px",
                        height: "calc(100vh - 170px)",
                        overflowY: "auto",
                        padding: "0 20px",
                        color: "#ffffff",
                        scrollbarWidth: "none"
                    }}>
                        
                        {/* Guide Search Box - NEW */}
                        <div className="search-box-wrapper animate-pop-up delay-1" style={{ marginBottom: "15px" }}>
                            <input 
                                type="text" 
                                placeholder="प्राथमिक उपचार खोज्नुहोस् (Search first aid...)" 
                                className="symptoms-search-input" // Reusing your existing styles
                                value={guideSearchTerm}
                                onChange={(e) => {
                                    const term = e.target.value.toLowerCase();
                                    setGuideSearchTerm(term);
                                    
                                    // DOM Filtering Engine
                                    const elements = document.querySelectorAll('.guide-card-item');
                                    elements.forEach(el => {
                                        const keywords = el.getAttribute('data-keywords').toLowerCase();
                                        if (keywords.includes(term)) {
                                            el.style.display = 'block';
                                        } else {
                                            el.style.display = 'none';
                                        }
                                    });
                                }}
                            />
                        </div>

                        <h2 style={{ fontSize: "20px", marginBottom: "15px", fontWeight: "600", color: "#ff7675" }}>
                            प्राथमिक उपचार निर्देशिका (First Aid Guide):
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "40px" }}>
                            
                            {/* CPR Guide */}
                            <div className="guide-card-item animate-pop-up delay-1" data-keywords="cpr chest compressions respiration मुटु छाती सास" style={{ background: "rgba(255, 255, 255, 0.12)", padding: "15px", borderRadius: "16px", backdropFilter: "blur(10px)", borderLeft: "4px solid #55efc4" }}>
                                <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                                    ❤️ CPR कसरी दिने? (Cardiopulmonary Resuscitation)
                                </h3>
                                <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: "1.6", opacity: 0.95 }}>
                                    <li>बिरामी होसमा छ कि छैन सुन्न र छाम्न प्रयास गर्नुहोस्। होस नभए तुरुन्तै १०२ मा कल गर्नुहोस्।</li>
                                    <li>बिरामीलाई समतल र कडा भुइँमा उत्तानो पारेर सुताउनुहोस्।</li>
                                    <li>आफ्नो एउटा हत्केलालाई बिरामीको छातीको बीच भागमा राख्नुहोस् र अर्को हातको औंलाहरू आपसमा बाँध्नुहोस् (Lock गर्नुहोस्)।</li>
                                    <li>आफ्नो कुहिनोलाई सीधा राख्दै प्रति मिनेट <b>१०० देखि १िको गतिमा तीव्रताका साथ छाती २ इन्च तलसम्म धस्सिने गरी दबाउनुहोस् (Push Hard & Fast)।</b></li>
                                    <li>यदि तपाईँ तालिमप्राप्त हुनुहुन्छ भने, प्रत्येक ३० पटक छाती दबाएपछि २ पटक मुखबाट कृत्रिम सास (Rescue Breaths) दिनुहोस्।</li>
                                </ol>
                            </div>

                            {/* Snake Bite Guide */}
                            <div className="guide-card-item animate-pop-up delay-2" data-keywords="snake bite venom सर्प टोकाइ विष एन्टिभेनम" style={{ background: "rgba(255, 255, 255, 0.12)", padding: "15px", borderRadius: "16px", backdropFilter: "blur(10px)", borderLeft: "4px solid #ffaa00" }}>
                                <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                                    🐍 सर्पले टोक्दा के गर्ने? (Snake Bite First Aid)
                                </h3>
                                <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: "1.6", opacity: 0.95 }}>
                                    <li>बिरामीलाई आत्तिन नदिई शान्त राख्नुहोस् (डराउँदा वा दौडिँदा मुटुको धड्कन बढेर विष छिटो फैलिन्छ)।</li>
                                    <li>टोकेको अङ्ग वा भागलाई चल्न नदिन कडा काठ वा कपडाले प्रबलीकरण (Immobilize) गर्नुहोस् र उक्त भागलाई <b>मुटुको तहभन्दा तल</b> राख्नुहोस्।</li>
                                    <li>टोकेको ठाउँ वरपर कसिलो कपडा, औंठी, घडी वा गहना छन् भने तुरुन्तै फुकाल्नुहोस् (सुन्निन सक्ने हुनाले)।</li>
                                    <li>घाउलाई सफा पानी वा साबुनपानीले बिस्तारै सफा गर्नुहोस् र हलुका सफा पट्टीले ढाक्नुहोस्।</li>
                                    <li>सर्पको पहिचान गर्ने प्रयास गर्नुहोस् (तस्बिर खिच्न सके राम्रो) र ढिला नगरी तुरुन्तै एन्टिभेनम (Anti-venom) उपलब्ध भएको अस्पताल लैजानुहोस्।</li>
                                </ol>
                            </div>

                            {/* Dog Bite Guide */}
                            <div className="guide-card-item animate-pop-up delay-3" data-keywords="dog bite rabies vaccine कुकुर टोकाइ रेबिज सुई" style={{ background: "rgba(255, 255, 255, 0.12)", padding: "15px", borderRadius: "16px", backdropFilter: "blur(10px)", borderLeft: "4px solid #a29bfe" }}>
                                <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                                    🐕 कुकुर वा अन्य जनावरले टोक्दा (Dog Bite & Rabies Slowdown)
                                </h3>
                                <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: "1.6", opacity: 0.95 }}>
                                    <li>रेबिज भाइरसको असरलाई कम गर्न वा फैलिनबाट रोक्न घाउलाई तुरुन्तै बगिरहेको सफा पानी र साबुनले <b>१० देखि १५ मिनेटसम्म</b> राम्ररी धुनुहोस्।</li>
                                    <li>एन्टिसेप्टिक क्रिम वा बिटाडिन उपलब्ध भएमा घाउमा लगाउनुहोस् र सफा कपडाले छोप्नुहोस्।</li>
                                    <li>घाउबाट धेरै रगत बगिरहेको छ भने सफा कपडाले केही बेर थिचेर रगत बग्न रोक्नुहोस्।</li>
                                    <li><b>चिकित्सक परामर्श (Consult a Doctor):</b> संक्रमण र रेबिजको जोखिमलाई पूर्ण रूपमा नियन्तरण गर्न २४ घण्टाभित्र डाक्टरसँग परामर्श गरी रेबिज विरुद्धको सुई (Anti-Rabies Vaccine) लगाउनुहोस्।</li>
                                </ol>
                            </div>

                            {/* Fracture Guide */}
                            <div className="guide-card-item animate-pop-up delay-4" data-keywords="fracture sprain care ice pack bone हड्डी भाँच्चिँदा मर्कँदा बरफ" style={{ background: "rgba(255, 255, 255, 0.12)", padding: "15px", borderRadius: "16px", backdropFilter: "blur(10px)", borderLeft: "4px solid #74b9ff" }}>
                                <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                                    🦴 हड्डी भाँचिँदा वा मर्कँदा (Fracture & Sprain Care)
                                </h3>
                                <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: "1.6", opacity: 0.95 }}>
                                    <li>थप चोट लाग्न नदिन र दुखाइ कम गर्न भाँचिएको वा मर्किएको भागलाई बिल्कुलै नचलाउनुहोस्।</li>
                                    <li>कमाची, कडा गत्ता (Cardboard) वा काठको सहायताले चोट लागेको अङ्गलाई स्थिर (Splint) पार्नुहोस्।</li>
                                    <li>सुन्निन र दुखाइ कम गर्न वा ढिलो बनाउन कपडामा बेरेर बरफ (Ice pack) ले १०-१५ मिनेट सम्म सेक्नुहोस् (सिधै छालामा बरफ नराख्नुहोस्)।</li>
                                    <li><b>चिकित्सक परामर्श (Consult a Doctor):</b> भित्री कति चोट लागेको छ पत्ता लगाउन र उचित ब्यान्डेज वा प्लास्टर गर्नका लागि तुरुन्तै डाक्टरसँग परामर्श गरी एक्स-रे (X-Ray) गराउनुहोस्।</li>
                                </ol>
                            </div>

                            {/* Heat Stroke / High Fever Guide */}
                            <div className="guide-card-item animate-pop-up delay-5" data-keywords="heat stroke high fever sun लु ज्वरो कडा तापमान" style={{ background: "rgba(255, 255, 255, 0.12)", padding: "15px", borderRadius: "16px", backdropFilter: "blur(10px)", borderLeft: "4px solid #fd79a8" }}>
                                <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                                    ☀️ कडा ज्वरो वा लु लाग्दा (High Fever / Heat Stroke Slowdown)
                                </h3>
                                <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: "1.6", opacity: 0.95 }}>
                                    <li>शरीरको तापक्रमलाई तीव्र गतिमा बढ्नबाट रोक्न (ढिलो गर्न) बिरामीलाई तुरुन्तै शितल वा छहारी भएको ठाउँमा सार्नुहोस्।</li>
                                    <li>बिरामीको लुगा खुकुलो बनाउनुहोस् र टाउको, गर्दन, र काखीमा चिसो पानीको पट्टी (Wet Sponge) राखेर तापक्रम घटाउने प्रयास गर्नुहोस्।</li>
                                    <li>यदि बिरामी होसमा छ र बान्ता गरेको छैन भने प्रशस्त मात्रामा जीवनजल, पानी वा झोल पदार्थ पिउन दिनुहोस्।</li>
                                    <li><b>चिकित्सक परामर्श (Consult a Doctor):</b> यदि शरीरको तापक्रम घट्नुको साटो १०३°F भन्दा माथि गइरहेमा वा बिरामी बेहोस हुन लागेमा तुरुन्तै अस्पताल पुर्‍याई आकस्मिक उपचार सुरु गर्नुहोस्।</li>
                                </ol>
                            </div>

                            {/* CRITICAL CAUTION BOX */}
                            <div className="guide-card-item animate-pop-up delay-6" data-keywords="caution danger warning सावधानी चेतावनी निषेध" style={{ background: "rgba(214, 48, 49, 0.25)", padding: "15px", borderRadius: "16px", backdropFilter: "blur(10px)", border: "1px solid #d63031" }}>
                                <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#ffffff", fontWeight: "bold" }}>
                                    ⚠️ कडा चेतावनी / सावधानी (CRITICAL CAUTION):
                                </h3>
                                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", lineHeight: "1.6", color: "#ffffff" }}>
                                    <li>सर्पले टोकेको ठाउँमा ब्लेड वा चक्कुले <b>काट्ने वा रक्तस्राव गराउने गल्ती कहिल्यै नगर्नुहोस्</b>।</li>
                                    <li>मुखले चुसेर <b>विष निकाल्ने प्रयास कडा रूपमा निषेध</b> छ; यसले गर्दा बचाउने व्यक्तिको ज्यान पनि जोखिममा पर्छ।</li>
                                    <li>टोकेको भाग भन्दा माथि डोरी वा कपडाले <b>अत्यधिक कसिलो गरी नबाँध्नुहोस् (Tourniquet नगर्नुहोस्)</b>, यसले रक्तसञ्चार पूर्ण बन्द भई उक्त अङ्ग सड्न सक्छ।</li>
                                    <li>कुकुरले टोकेको घाउलाई <b>बाँध्ने वा टाँका लगाउने काम (Suturing) नगर्नुहोस्</b>; यसले भाइरस भित्रै रोकिने जोखिम बढाउँष।</li>
                                    <li>हड्डी भाँचिएको ठाउँलाई जबर्जस्ती <b>सिधा पार्ने वा थिचेर मिलाउने प्रयास नगर्नुहोस्</b>, यसले नसाहरू काटिन सक्छन्।</li>
                                    <li>धामीझाँक्री वा घरेलु जडीबुटीको चक्करमा लागेर अमूल्य समय खेर नफाल्नुहोस्।</li>
                                </ul>
                            </div>

                        </div>
                    </div>
                </div>
                )}

                {ActiveTab === 'Symptoms' && (
                    <div className="screen-wrapper specialist" >
                    <header className="floating-header">
                        <button className="back-btn" onClick={() => setActiveTab('home')} onTouchStart={() => setActiveTab('home')}>← Back</button>
                        <div className="header-title">रोग र लक्षणहरू</div>
                    </header>

                    <div className="symptoms-container">
                        {/* Search Box - Matches English & Nepali Keywords */}
                        <div className="search-box-wrapper animate-pop-up delay-1">
                            <input 
                                type="text" 
                                placeholder="लक्षणहरू खोज्नुहोस् (Search symptoms... e.g., fever, cough)" 
                                className="symptoms-search-input"
                                onChange={(e) => {
                                    const term = e.target.value.toLowerCase().trim();
                                    const items = document.querySelectorAll('.disease-card-item');
                                    
                                    items.forEach(item => {
                                        const symptoms = item.getAttribute('data-symptoms').toLowerCase();
                                        if (symptoms.includes(term)) {
                                            item.style.display = 'block';
                                        } else {
                                            item.style.display = 'none';
                                        }
                                    });
                                }}
                            />
                        </div>

                        {/* Scrollable Disease List */}
                        <div className="disease-scroll-list">
                            {[
                                // High Severity Diseases
                                { name: "Rabies (रेलेज)", severity: "High", transmission: "जनावरको टोकाइबाट (कुकुर, बाँदर)", symptoms: "टोकेको ठाउँमा झनझनाहट हुनु, अत्यधिक उत्तेजना हुनु, पानीसँग डराउनु (हाइड्रोफोबिया), र्‍याल अत्यधिक आउनु", keywords: "hydrophobia, tingling bite, excessive saliva, agitation, panic, water fear" },
                                { name: "Cholera (हैजा)", severity: "High", transmission: "दूषित खाना वा पानी", symptoms: "प्रशस्त 'चौलानी जस्तो' दिसा हुनु, अत्यधिक बान्ता हुनु, शरीरमा पानीको मात्रा तीव्र रूपमा कम हुनु", keywords: "rice water stool, watery diarrhea, severe vomiting, dehydration, fluid loss" },
                                { name: "Meningococcal Meningitis (मेनिन्जाइटिस)", severity: "High", transmission: "स्वासप्रश्वासका मसिना थोपाहरूबाट", symptoms: "अचानक उच्च ज्वरो आउनु, कडा टाउको दुख्नु, घाँटी कडा हुनु, अलमल्ल पर्नु", keywords: "high fever, severe headache, stiff neck, confusion, altered mental state" },
                                { name: "Neonatal Tetanus (धनुष्टंकार)", severity: "High", transmission: "नाभी काट्दा वा सम्हाल्दा फोहोर औजारको प्रयोग हुनु", symptoms: "बङ्गारा बाँधिनु (लकज), मांसपेशीहरू निकै दुख्नु र बाउँडिनु, शरीर धनुष जस्तै कडा हुनु", keywords: "lockjaw, muscle spasms, rigid body, painful stiffness, newborn tetanus" },
                                { name: "Japanese Encephalitis (मस्तिष्क ज्वरो)", severity: "High", transmission: "क्युलेक्स (Culex) लामखुट्टेको टोकाइबाट", symptoms: "उच्च ज्वरो आउनु, घाँटी कडा हुनु, कम्पन हुनु, छारे रोग जस्तो काँप्नु, बेहोस हुनु", keywords: "high fever, stiff neck, tremors, seizures, convulsions, unconsciousness, brain fever" },

                                // Medium Severity Diseases
                                { name: "Pneumonia / ARI (न्युमोनिया)", severity: "Medium", transmission: "हावामा फैलिने स्वासप्रश्वासका थोपाहरूबाट", symptoms: "छिटो-छिटो सास फेर्नु, कोखा हान्नु (छाती भित्र धसिनु), घ्यारघ्यारसहितको खोकी, ओठ निलो हुनु", keywords: "fast breathing, chest indrawing, wheezing, rattling cough, blue lips, cyanosis, short of breath" },
                                { name: "Typhoid Fever (म्याद थपे ज्वरो)", severity: "Medium", transmission: "दूषित खाना/पानी वा दिसा-मुख मार्गबाट", symptoms: "दिनदिनै खुड्किलो जस्तै बढ्दै जाने ज्वरो, पेट निकै दुख्नु, सुक्खा खोकी, अत्यधिक थकान वा शिथिलता", keywords: "step ladder fever, progressive fever, stomach pain, abdominal ache, dry cough, extreme fatigue, weakness" },
                                { name: "Scrub Typhus (स्क्रब टाइफस)", severity: "Medium", transmission: "संक्रमित सानो किर्ना (chigger) को टोकाइबाट", symptoms: "उच्च ज्वरो आउनु, कडा टाउको दुख्नु, चुरोटले पोलेको जस्तो कालो पाप्रा (eschar) बस्नु", keywords: "high fever, severe headache, black eschar, cigarette burn mark, scab, mite bite" },
                                { name: "Leptospirosis (लेप्टोस्पाइरोसिस)", severity: "Medium", transmission: "बाढीको पानीमा मुसाको पिसाबसँग प्रत्यक्ष सम्पर्क हुनु", symptoms: "अचानक ज्वरो आउनु, आँखा बिना पीप रातो हुनु, पिँडौलाको मांसपेशी निकै दुख्नु, जन्डिस हुनु", keywords: "sudden fever, red eyes without pus, severe calf muscle pain, jaundice, yellow skin, rat urine" },
                                { name: "Chronic Kidney Disease (मिर्गौला रोग)", severity: "Medium", transmission: "लामो समयसम्मको मधुमेह वा उच्च रक्तचाप", symptoms: "सुरुवाती चरणमा लक्षण नदेखिनु; पछि शरीर सुन्निनु, थकान लाग्नु, मिर्गौलाको कार्यक्षमता घट्दै जानु", keywords: "asymptomatic early, body swelling, edema, chronic fatigue, low kidney function, uremia" },

                                // Low Severity Diseases
                                { name: "The Common Cold (रुघाखोकी)", severity: "Low", transmission: "स्वासप्रश्वासका भाइरसका कणहरू", symptoms: "नाक बन्द हुनु, सिंगान बग्नु, हाँछ्युँ आउनु, घाँटी सामान्य दुख्नु", keywords: "stuffy nose, blocked nose, runny nose, sneezing, mild sore throat, common cold" },
                                { name: "Gastritis (ग्यास्ट्रिक / एसिडिटी)", severity: "Low", transmission: "एच. पाइलोरी (H. pylori) संक्रमण वा अस्वस्थ जीवनशैली", symptoms: "पेटको माथिल्लो भाग पोल्नु, पेट फुल्नु, तारन्तार वाकवाकी लाग्नु", keywords: "upper stomach burning, heartburn, bloating, nausea, acidity, indigestion" },
                                { name: "Giardiasis (जीयार्डिया)", severity: "Low", transmission: "राम्रोसँग उपचार नगरिएको वा दूषित पानीको प्रयोग", symptoms: "गन्ध आउने चिल्लो दिसा हुनु, पेट फुल्नु, अमिलो डकार आउनु", keywords: "foul smelling greasy stool, bloating, sulfur burps, greasy diarrhea" },
                                { name: "Conjunctivitis (आँखा पाक्ने रोग)", severity: "Low", transmission: "आँखाबाट निस्कने तरल पदार्थको प्रत्यक्ष सम्पर्कबाट", symptoms: "आँखाको सेतो भाग गाढा गुलाबी वा रातो हुनु, आँखा बिझाउनु, बाक्लो पहेंलो कचेरा लाग्नु", keywords: "pink eye, red eyes, eye irritation, gritty feeling, thick yellow discharge, crusty eyes" },
                                { name: "Ringworm / Athlete's Foot", severity: "Low", transmission: "छालाको प्रत्यक्ष सम्पर्क वा ओसिलो तौलियाहरू साटासाट गर्दा", symptoms: "चिलाउने, गोलो र अलि उठेको रातो डाबर वा दाद आउनु, औंलाहरूका बीचको छाला उप्किनु", keywords: "itchy skin, circular red rash, ringworm, peeling skin between toes, fungal infection" },
                                { 
                                    name: "Chronic Obstructive Pulmonary Disease (COPD)", 
                                    severity: "High", 
                                    transmission: "भित्री कोठाको दाउरा/बायोमास चुल्होको धुवाँ, अत्यधिक वायु प्रदुषण, र धुम्रपान", 
                                    symptoms: "क्रोनिक (दीर्घकालीन) र बढ्दै जाने खोकी, कडा सास फेर्न गाह्रो हुनु (विशेष गरी हिँडडुल गर्दा), छाती घ्यारघ्यार हुनु, छाती कसिने र ठूलो मात्रामा खकार आउनु",
                                    keywords: "chronic cough, progressive breathlessness, shortness of breath on exertion, wheezing, chest tightness, heavy sputum production, phlegm" 
                                },
                                { 
                                    name: "Dengue (डेङ्गु)", 
                                    severity: "High", 
                                    transmission: "संक्रमित एडिस (Aedes) लामखुट्टेको टोकाइबाट", 
                                    symptoms: "अचानक उच्च ज्वरो आउनु, आँखाको पछाडिको भाग तीव्र दुख्नु, जोर्नी र मांसपेशीहरू निकै दुख्नु (हड्डी भाँच्चिए जस्तो दुख्ने), र छालामा रातो डाबरहरू आउनु",
                                    keywords: "sudden high fever, retro-orbital pain, severe bone joint pain, breakbone fever, muscle ache, red skin rash" 
                                },
                                { 
                                    name: "Tuberculosis (TB - क्षयरोग)", 
                                    severity: "High", 
                                    transmission: "हावाको माध्यमबाट फैलिने ब्याक्टेरिया (खोक्दा वा हाछ्युँ गर्दा)", 
                                    symptoms: "३ हप्ता वा सोभन्दा बढी समयसम्म लगातार खोकी लाग्नु, खोकीमा रगत देखिनु, बेलुकापख ज्वरो आउनु र राति पसिना आउनु, अप्रत्याशित रूपमा तौल घट्नु",
                                    keywords: "cough more than 3 weeks, blood in sputum, hemoptysis, low grade evening fever, night sweats, unexplained weight loss" 
                                },
                                { 
                                    name: "Malaria (औलो / मलेरिया)", 
                                    severity: "High", 
                                    transmission: "संक्रमित एनोफिलिज (Anopheles) लामखुट्टेको टोकाइबाट", 
                                    symptoms: "काँपछ्रुट्ने चिसो र काम्च्युरोसहित चक्रिय रूप रूपमा उच्च ज्वरो आउनु, ज्वरो घट्दा अत्यधिक पसिना आउनु, र कडा शरीर दुख्नु",
                                    keywords: "shivering chills, rigors, cyclic high fever, profuse sweating, severe body ache" 
                                },
                                { 
                                    name: "Gastroenteritis / Diarrhea (झाडापखाला)", 
                                    severity: "Medium", 
                                    transmission: "दूषित पानी वा खानाको माध्यमबाट (विशेष गरी मनसुनको समयमा)", 
                                    symptoms: "पटक-पटक पातलो दिसा हुनु, पेट निकै मरोड्नु र दुख्नु, बान्ता हुनु, र शरीरमा पानीको मात्रा तीव्र रूपमा कम हुनु (मुख सुक्नु, रिंगटा लाग्नु)",
                                    keywords: "frequent loose watery stool, diarrhea, abdominal cramps, stomach cramps, vomiting, dehydration, dry mouth, dizziness" 
                                },
                                { 
                                    name: "Diabetes Mellitus (Type 2 - मधुमेह)", 
                                    severity: "Medium", 
                                    transmission: "इन्सुलिन प्रतिरोधात्मक क्षमता र अस्वस्थ जीवनशैलीका कारण रगतमा ग्लुकोजको मात्रा बढ्नु", 
                                    symptoms: "अत्यधिक तिर्खा लाग्नु, विशेष गरी राती पटक-पटक पिसाब लाग्नु, भोक बढ्नु, र काटेको वा लागेको चोट ढिलो निको हुनु",
                                    keywords: "excessive thirst, polydipsia, frequent nighttime urination, polyuria, increased hunger, delayed wound healing, slow healing cuts" 
                                },
                                { 
                                    name: "Jaundice / Hepatitis A & E (जन्डिस / कलेजोको सुजन)", 
                                    severity: "Medium", 
                                    transmission: "दूषित पानी वा खानाको प्रयोग (fecal-oral मार्ग) मार्फत कलेजोमा भाइरस संक्रमण", 
                                    symptoms: "आँखा र छाला पहेंलो हुनु, गाढा बियर जस्तो रंगको पिसाब आउनु, भोक कत्ति पनि नलाग्नु, वाकवाकी लाग्नु, र पेटको माथिल्लो भाग दुख्नु",
                                    keywords: "yellow eyes, yellow skin, dark tea colored urine, loss of appetite, nausea, upper abdominal pain, liver inflammation" 
                                },
                                { 
                                    name: "Kidney Stones (मिर्गौलाको पत्थरी)", 
                                    severity: "Medium", 
                                    transmission: "मिर्गौला भित्र खनिज र नुनका कणहरू जम्मा भई कडा गेडागुडी बन्नु", 
                                    symptoms: "कम्मरको तल्लो भाग वा कोखामा असह्य तीखो पीडा हुनु जुन तल्लो पेटतिर सर्छ, पिसाब फेर्दा दुख्नु, र गुलाबी वा धमिलो पिसाब आउनु",
                                    keywords: "severe flank pain, sharp lower back pain, radiating groin pain, painful urination, dysuria, pink cloudy urine, hematuria" 
                                },
                                { 
                                    name: "Urinary Tract Infection (UTI - पिसाब थैलीको संक्रमण)", 
                                    severity: "Medium", 
                                    transmission: "पिसाब नलीमा ब्याक्टेरियाको संक्रमण हुनु (महिलाहरूमा बढी देखिने)", 
                                    symptoms: "पिसाब फेर्दा कडा जलन वा पोलेको महसुस हुनु, पटक-पटक र छिटो-छिटो थोरै पिसाब आउनु, र तल्लो पेटमा दबाब वा पीडा हुनु",
                                    keywords: "burning micturition, painful urination, urinary urgency, frequent small urination, pelvic pain, lower abdominal pressure" 
                                },
                                { 
                                    name: "Major Depressive Disorder (Depression - डिप्रेसन)", 
                                    severity: "Medium", 
                                    transmission: "लामो समयसम्म रहने मुड विकार (मानसिक स्वास्थ्य अवस्था)", 
                                    symptoms: "लगातार उदास महसुस हुनु, पहिले रमाइलो लाग्ने कुराहरूमा रुचि घट्नु, हरसमय थकान लाग्नु, निद्रामा गडबडी हुनु, र समाज वा साथीभाइबाट टाढिनु",
                                    keywords: "persistent sadness, depressed mood, anhedonia, loss of interest, chronic fatigue, low energy, insomnia, sleep disturbance, social withdrawal" 
                                },
                                { 
                                    name: "Hypothyroidism (थाइराइड हर्मोनको कमी)", 
                                    severity: "Medium", 
                                    transmission: "थाइराइड ग्रन्थिले शरीरलाई चाहिने आवश्यक थाइराइड हर्मोन उत्पादन गर्न नसक्नु", 
                                    symptoms: "विना कारण तौल बढ्नु, अत्यधिक थकान र सुस्ती महसुस हुनु, पुरानो कब्जियत हुनु, छाला सुक्खा हुनु, र चिसो बढी लाग्नु",
                                    keywords: "unexplained weight gain, extreme fatigue, lethargy, chronic constipation, dry skin, cold intolerance" 
                                },
                                { 
                                    name: "Polycystic Ovary Syndrome (PCOS)", 
                                    severity: "Medium", 
                                    transmission: "प्रजनन उमेरका महिलाहरूमा हुने हर्मोनको असन्तुलन र मेटाबोलिक परिवर्तन", 
                                    symptoms: "महिनावारी अनियमित हुनु वा रोकिनु, अनुहार वा शरीरमा अत्यधिक रौं पलाउनु, तीव्र रूपमा तौल बढ्नु, र कडा खालको डन्डीफोर (cystic acne) आउनु",
                                    keywords: "irregular periods, missed menstruation, facial hair growth, hirsutism, rapid weight gain, severe cystic acne" 
                                },
                                { 
                                    name: "Anemia (रक्तअल्पता / रगतको कमी)", 
                                    severity: "Medium", 
                                    transmission: "मुख्यतया फलाम (Iron) को कमीले गर्दा रगतमा स्वस्थ रातो रक्तकोष वा हेमोग्लोबिन घट्नु", 
                                    symptoms: "लगातार ऊर्जाको कमी र शारीरिक कमजोरी महसुस हुनु, छाला फुस्रो वा पहेंलो देखिनु, हातखुट्टा चिसो हुनु, रिंगटा लाग्नु, र सास फेर्न गाह्रो हुनु",
                                    keywords: "chronic fatigue, physical weakness, pale skin, cold hands feet, dizziness, lightheadedness, shortness of breath, iron deficiency" 
                                },
                                { 
                                    name: "Allergic Asthma (एलर्जीक दम)", 
                                    severity: "Low", 
                                    transmission: "धुलो, चिसो र प्रदुषण जस्ता वातावरणीय कारकहरूले श्वासप्रश्वासको नली सुन्निनु", 
                                    symptoms: "सास फेर्न गाह्रो हुनु, सास बाहिर फाल्दा सुनिने खालको घ्यारघ्यार हुनु, छाती कसिने र चिसो वा धुलोले सुक्खा खोकी चल्नु",
                                    keywords: "difficulty breathing, expiratory wheezing, chest tightness, dry cough triggered by dust cold dust allergy" 
                                },
                                { 
                                    name: "Sinusitis (पिनास)", 
                                    severity: "Low", 
                                    transmission: "एलर्जी वा चिसो लाग्दा नाकको भित्री खाली भाग (cavities) सुन्निनु वा संक्रमण हुनु", 
                                    symptoms: "निधार र आँखा वरपर अनुहारमा भारीपन वा टन्किएको जस्तो पीडा हुनु, बाक्लो सिंगान आउने र नाक बन्द हुनु, सुँघ्ने क्षमता अस्थायी रूपमा घट्नु",
                                    keywords: "facial pressure, forehead headache, facial pain, thick nasal discharge, nasal congestion, blocked nose, loss of smell" 
                                },
                                { 
                                    name: "Gout / High Uric Acid (युरिक एसिड / बाथ)", 
                                    severity: "Low", 
                                    transmission: "जोर्नीहरूमा युरिक एसिडको क्रिस्टल जम्मा हुनु (रक्सी, रातो मासु वा तामाको बढी सेवनले)", 
                                    symptoms: "जोर्नीहरू अचानक निकै दुख्नु, रातो हुनु, तातो हुनु र कडा सुन्निनु (विशेष गरी खुट्टाको बुढी औंलाको फेदमा)",
                                    keywords: "sudden acute joint pain, red hot swollen joint, big toe joint inflammation, uric acid flare up" 
                                },
                                { 
                                    name: "Generalized Anxiety Disorder (GAD - एन्जाइटी)", 
                                    severity: "Low", 
                                    transmission: "दैनिक जीवनका साधारण कुराहरूमा पनि अत्यधिक, अनियन्त्रित र लगातार चिन्ता लाग्ने मानसिक अवस्था", 
                                    symptoms: "हरसमय डर वा आत्तिएको महसुस हुनु, मुटुको धड्कन बढ्नु, हात काँप्नु, मांसपेशीहरू कसिनु, र छटपटी हुनु",
                                    keywords: "constant worry, panic, racing heart, palpitations, hand tremors, muscle tension, restlessness, anxiety" 
                                },
                                { 
                                    name: "Osteoarthritis (जोर्नी खिइने रोग)", 
                                    severity: "Low", 
                                    transmission: "बढ्दो उमेर वा बढी तौलका कारण जोर्नीहरूमा रहने सुरक्ष्यात्मक कुरकुरे हड्डी (cartilage) बिस्तारै खिइनु", 
                                    symptoms: "हलचल गर्दा जोर्नी दुख्नु र कडा हुनु (विशेष गरी बसेर उठ्दा घुँडा दुख्नु), सुन्निनु, र जोर्नी चलाउँदा कटकट बजेको महसुस हुनु",
                                    keywords: "joint pain on movement, joint stiffness, knee pain when standing up, swelling, joint crepitus, cracking sound" 
                                },
                                { 
                                    name: "Eczema (Atopic Dermatitis - एकजिमा)", 
                                    severity: "Low", 
                                    transmission: "प्रतिरक्षा प्रणालीको संवेदनशीलता र छालाको एलर्जीका कारण हुने पुरानो समस्या", 
                                    symptoms: "छाला निकै चिलाउनु, रातो वा खैरो रङको सुक्खा दागहरू देखिनु, र कन्याउँदा पानी वा तरल पदार्थ निस्कने साना फोकाहरू आउनु",
                                    keywords: "intense itching, red dry skin patches, weeping blisters, fluid oozing skin, skin rash" 
                                },
                                { 
                                    name: "Psoriasis (सोरायसिस / कत्ले दाद)", 
                                    severity: "Low", 
                                    transmission: "अटोइम्यून समस्या जसले छालाका कोषहरू तीव्र रूपमा बढाउँछ र छालाको सतह बाक्लो बनाउँछ", 
                                    symptoms: "चाँदी जस्तो कत्लाले ढाकिएको छालाको बाक्लो र रातो दागहरू देखिनु, छाला अत्यधिक सुक्खा भई फुट्नु र रगत आउनु, चिलाउनु वा पोल्नु",
                                    keywords: "silvery scales, thick red plaques, extremely dry cracked skin, bleeding skin patches, itching burning skin" 
                                },
                                { 
                                    name: "Otitis Media (कानको मध्य भागको संक्रमण)", 
                                    severity: "Low", 
                                    transmission: "कानको जालीको पछाडिको भागमा हुने संक्रमण वा सुजन (साना बच्चाहरूमा बढी देखिने)", 
                                    symptoms: "कान निकै दुख्नु, कानबाट गन्ध आउने तरल पदार्थ वा पीप बग्नु, अस्थायी रूपमा सुन्ने क्षमता कम हुनु, र बच्चाहरू धेरै रुनु वा चिडचिडा हुनु",
                                    keywords: "severe earache, ear pain, foul smelling ear discharge, pus from ear, temporary hearing loss, crying irritable infant" 
                                },
                                { 
                                    name: "Tonsillitis (टन्सिल सुनिनु)", 
                                    severity: "Low", 
                                    transmission: "घाँटीको पछाडि रहने टन्सिलमा भाइरस वा ब्याक्टेरियाको संक्रमण हुनु", 
                                    symptoms: "घाँटी कडा दुख्नु, खानेकुरा वा थुक निल्न निकै गाह्रो हुनु, ज्वरो आउनु, बङ्गारा मुनिको ग्रन्थि सुन्निनु, र टन्सिलमा सेतो दाग देखिनु",
                                    keywords: "severe sore throat, difficulty swallowing, odynophagia, fever, swollen jaw glands, tonsil white spots" 
                                },
                                { 
                                    name: "Migraine (माइग्रेन / आधा टाउको दुख्ने)", 
                                    severity: "Low", 
                                    transmission: "माइग्रेन स्नायुसम्बन्धी समस्या आधा टाउको कडा असह्य पीडा उत्पन्न", 
                                    symptoms: "टाउकोको एकतर्फ टन्केर कडा दुख्नु, वाकवाकी लाग्नु वा बान्ता हुनु, र चम्किलो उज्यालो, ठूलो आवाज वा कडा गन्धसँग अत्यधिक गाह्रो हुनु",
                                    keywords: "one sided throbbing headache, unilateral head pain, nausea, vomiting, photophobia, phonophobia, light sound sensitivity" 
                                },
                                { 
                                    name: "Varicose Veins (नशा फुल्ने समस्या)", 
                                    severity: "Low", 
                                    transmission: "खुट्टाका नसाका भल्भहरू कमजोर हुँदा रगत उल्टो बगेर नसाहरू घुम्चिनु र ठूलो हुनु", 
                                    symptoms: "पिँडौलामा गाढा बैजनी वा निलो रङका घुम्रिएका नसाहरू स्पष्ट देखिनु, खुट्टा भारी भएको वा दुखेको महसुस हुनु, र बेलुकापख गोलीगाँठो वरपर सामान्य सुन्निनु",
                                    keywords: "enlarged twisted veins, dark purple blue leg veins, heavy legs, aching calf, mild ankle swelling" 
                                }
                            ].map((disease, idx) => {
                                // Combine Nepali descriptions and English keywords into a single search target
                                const searchableIndex = `${disease.symptoms} ${disease.keywords || ''}`;
                                
                                return (
                                    <div 
                                        key={idx} 
                                        className="disease-card-item animate-pop-up" 
                                        style={{ animationDelay: `${0.05 * (idx + 1)}s` }}
                                        data-name={disease.name}
                                        data-symptoms={searchableIndex} 
                                        onClick={(e) => {
                                            e.currentTarget.classList.toggle('expanded');
                                        }}
                                    >
                                        <div className="disease-card-header">
                                            <span className="disease-name-text">{disease.name}</span>
                                            <span className={`severity-badge ${disease.severity.toLowerCase()}`}>
                                                {disease.severity}
                                            </span>
                                        </div>
                                        
                                        <div className="disease-card-details">
                                            <hr className="details-divider" />
                                            <p><strong>सर्ने माध्यम (Transmission):</strong> {disease.transmission}</p>
                                            <p style={{ marginTop: '6px' }}><strong>मुख्य लक्षणहरू (Symptoms):</strong> {disease.symptoms}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                )}



                {ActiveTab === 'notify' && (
                    <div className="screen-wrapper specialist">
                        <header className="floating-header">
                            <button className="back-btn" onClick={() => setActiveTab('home')} onTouchStart={() => setActiveTab('home')}>← Back</button>
                            <div className="header-title" style={{ color: "#0f6d5a" }}>सूचनाहरू (Notifications)</div>
                        </header>

                        <div className="symptoms-container" style={{ marginTop: "85px" }}>
                            <div className="disease-scroll-list" style={{ height: "calc(100vh - 170px)", overflowY: "auto" }}>
                                {notifLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>सूचनाहरू लोड हुँदैछ...</div>
                                ) : notifications.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>कुनै नयाँ सूचना छैन।</div>
                                ) : (
                                    notifications.map((notif, idx) => (
                                        <div 
                                            key={idx} 
                                            className="disease-card-item animate-pop-up expanded" 
                                            style={{ animationDelay: `${0.05 * (idx + 1)}s`, marginBottom: '12px' }}
                                        >
                                            <div className="disease-card-header" style={{height: "auto",}}>
                                                <span className="disease-name-text" style={{ fontWeight: '700', color: '#2c3e50' }}>
                                                    🔔 {notif.title}
                                                </span>
                                            </div>
                                            
                                            <div className="disease-card-details" style={{ display: 'block', paddingTop: '8px' }}>
                                                <p style={{ margin: 0, fontSize: '14px', color: '#4a5568', lineHeight: '1.5' }}>
                                                    {notif.details}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div> 
                )}

            {['home', 'record', 'account','Specialist','Guide','Symptoms', 'notify'].includes(ActiveTab) && (
            <div className="bot">
                <nav className="navigation-bar-bot">
                    {/* The sliding bar is anchored here */}
                    <div className={`bar ${ActiveTab === 'record' ? 'record' : ActiveTab === 'account' ? 'account' : 'home'}`}></div>
                    
                    <button 
                        className={ActiveTab === 'home' ? 'nav-item-active' : ''} 
                        onClick={() => setActiveTab('home')}
                        onTouchStart={() => setActiveTab('home')}
                    >
                        Home
                    </button>
                    <button 
                        className={ActiveTab === 'record' ? 'nav-item-active' : ''} 
                        onClick={() => setActiveTab('record')}
                        onTouchStart={() => setActiveTab('record')}
                    >
                        Fitness
                    </button>
                    <button 
                        className={ActiveTab === 'account' ? 'nav-item-active' : ''} 
                        onClick={() => setActiveTab('account')}
                        onTouchStart={() => setActiveTab('account')}
                    >
                        Account
                    </button>
                </nav>
            </div>
            )}
        </div>
    );
}

export default App;