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
    const [Login, setLogin] = useState(false);
    const [Gender, setGender] = useState('null');
    const [formData, setFormData] = useState({
        fullName: '',
        address: '',
        phone: '',
        gender: Gender
    });
    
    useEffect(()=>{
        if (Login){
            setActiveTab('home');
        }
    },[]);

    const handleChange = (e) =>{
        const { name, value } = e.target;
            setFormData((prevData) => ({
        ...prevData,
        [name]: value
        }));
    };


    const handleSubmit = (e) => {
     e.preventDefault();

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
                        <img src={bell} className="bell" alt="Notifications" />
                    </button>
                    {NodeCount > 0 && <div className="badge">{NodeCount}</div>}
                </div>
            </header>
        )}
            

            {ActiveTab === 'login' && (
                <div className="main-container animate-pop-up delay-1 ">
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
                                 onChange={handleChange}
                                 required
                                />
                            </label>
                            <label>
                                <b>Your Address (ठेगाना):</b>
                                <input
                                name="address"
                                 className="input"
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
                                required
                                >
                                
                                </input>
                            </label>

                            <label>
                                
                                <b>Gender (लिङ्ग)</b><br />
                                <button className={`gender ${Gender === "male" ? "m" : ""}`}
                                
                                onClick={() => {setGender('male');setFormData(prev => ({ ...prev, gender: 'male' }))}} 
                                onTouchStart={() => {setGender('male');setFormData(prev => ({ ...prev, gender: 'male' }))}}
                                >Male</button>

                                <button className={`gender ${Gender === "female" ? "f" : ""}`}
                                 onClick={() => {setGender('female');setFormData(prev => ({ ...prev, gender: 'female' }))}}
                                 onTouchStart={() => {setGender('female');setFormData(prev => ({ ...prev, gender: 'female' }))}}
                                 >Female</button>

                            </label>

                            <button type="submit" className="submit">Submit</button>
                             {/* <pre>{JSON.stringify(formData, null, 2)}</pre> */}
                        </form>
                    </div>
                </div>

            )}
            
            
            
            { ActiveTab === 'home' && (<div className="main-container">
            <div className="clickable"> 
                <button className="but animate-pop-up delay-1">
                    <Hospital size={28} color="#ffffff" className="hospital-icon"/>
                    <div className="btn-text-group">
                        <h1 className="title1">Emergency Sewa</h1> 
                        <p className="dis1">आपतकालीन सेवा</p>
                    </div>
                </button>
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
                            <h3 className="qtip-title"><Info size={24} color="#0f6d5a" className="info-icon" />द्रुत सुझावहरू</h3>
                            <ul typeof="disc">
                                <li className="qtip-body">
                                    <p>खाना खानुअघि हात धुनुहोस्।</p>  
                                </li>
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
                    <div className="main-container">
                        <h1>Records</h1>
                    </div>
                )}

                {ActiveTab === 'account' && (
                    <div className="main-container">
                        <h1>Account</h1>
                    </div>
                )}
              

                {ActiveTab === 'Specialist' && (
                    <div className="screen-wrapper specialist">
                        <header className="floating-header">
                            <button className="back-btn" onClick={() => setActiveTab('home')} onTouchStart={() => setActiveTab('home')}>← Back</button>
                            <div className="map-header-title">विशेषज्ञ</div>
                        </header>
                    </div>
                )}

                {ActiveTab === 'Locate' && (
                    <div className="screen-wrapper map">
                        {/* <header className="floating-header">
                            <button className="back-btn" onClick={() => setActiveTab('home')}>← Back</button>
                            <div className="header-title">नजिकैका अस्पतालहरू</div>
                        </header>

                        <div className={`bottom-sheet ${isMapSheetExpanded ? 'expanded' : ''}`}>
                            
                            <div 
                                className="sheet-interactive-header" 
                                onClick={() => setIsMapSheetExpanded(!isMapSheetExpanded)}
                                onTouchStart={() => setIsMapSheetExpanded(!isMapSheetExpanded)} 
                            >
                                <div className="sheet-drag-handle"></div>
                                <div className="sheet-header-group">
                                    <h3 className="radius-title">अस्पताल निर्देशिका</h3>
                                    <p className="radius-subtitle">
                                        {isMapSheetExpanded ? 'स्वाइप डाउन गरेर सानो बनाउनुहोस्' : 'माथि तान्नुहोस् वा थिच्नुहोस्'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="sheet-content-container">
                                <div className="hospital-scroll-list">
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
                                    {!loading && nearbyHospitals.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>कुनै अस्पताल भेटिएन।</div>
                                    )}
                                </div>
                            </div>
                        </div> */}
                    </div> 
                )}

                {ActiveTab === 'Guide' && (
                    <div className="screen-wrapper specialist">
                        <header className="floating-header">
                            <button className="back-btn" onClick={() => setActiveTab('home')} onTouchStart={() => setActiveTab('home')}>← Back</button>
                            <div className="map-header-title">निर्देशन</div>
                        </header>
                    </div>   
                )}

                {ActiveTab === 'Symptoms' && (
                    <div className="screen-wrapper specialist">
                        <header className="floating-header">
                            <button className="back-btn" onClick={() => setActiveTab('home')} onTouchStart={() => setActiveTab('home')}>← Back</button>
                            <div className="map-header-title">लक्षणहरू</div>
                        </header>
                    </div>   
                )}

            {['home', 'record', 'account','Specialist','Guide','Symptoms'].includes(ActiveTab) && (
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
                        Records
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