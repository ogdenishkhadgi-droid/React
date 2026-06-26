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

    const [ActiveTab , setActiveTab] = useState('home');

    const [Translate , setTranslate] = useState('bar');

    const [isMapSheetExpanded, setIsMapSheetExpanded] = useState(false);

    const [nearbyHospitals, setNearbyHospitals] = useState([]);
    const [loading, setLoading] = useState(false);

    const [mylocationLat , setMyLocationLat] = useState(27.7172);
    const [mylocationLng , setMyLocationLng] = useState(85.3240);

    
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

    useEffect(() => {
    const fetchHospitalsInRadius = async () => {
        setLoading(true);
        
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
            const data = await response.json();
            
            const formattedHospitals = data.elements.map((element, index) => {
                const hospitalLat = element.lat || (element.center && element.center.lat);
                const hospitalLng = element.lon || (element.center && element.center.lon);
                
                return {
                    id: element.id || index,
                    name: element.tags.name || "अस्पताल (Hospital)",
                    address: element.tags["addr:street"] || "Nearby",
                    phone: element.tags.phone || element.tags["contact:phone"] || "102", 
                    location: [hospitalLat, hospitalLng]
                };
            });

                        setNearbyHospitals(formattedHospitals);
                    } catch (error) {
                        console.error("Error matching local radius hospitals:", error);
                    } finally {
                        setLoading(false);
                    }
                };

                fetchHospitalsInRadius();
            }, []); 

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
                <button className="back-btn" onClick={() => setActiveTab('home')}>← Back</button>
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
                    <button className="notify-but" onClick={Clearit}>
                        <img src={bell} className="bell" alt="Notifications" />
                    </button>
                    {NodeCount > 0 && <div className="badge">{NodeCount}</div>}
                </div>
            </header>
        )}
            
            
            
            { ActiveTab === 'home' && (<div className="main-container">
            <div className="clickable"> 
                <button className="but animate-pop-up delay-1" onClick={press_append}>
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
                        <button className="node-but animate-pop-up delay-2 " onClick={() => setActiveTab('Specialist')}>
                            <Stethoscope size={32} className="node-icon clinic-color" />
                            <span className="node-title">Specialists</span>
                            <span className="node-title-nep">विशेषज्ञ</span>
                        </button>
                    </div>

                    <div className="clickable">
                        <button className="node-but animate-pop-up delay-3" onClick={() => setActiveTab('Locate')}>
                            <MapPin size={32} className="node-icon map-color" />
                            <span className="node-title">Nearby</span>
                            <span className="node-title-nep">नजिकै</span>
                        </button>
                    </div>

                    <div className="clickable">
                        <button className="node-but animate-pop-up delay-4" onClick={() => setActiveTab('Guide')}>
                            <Compass size={32} className="node-icon guide-color" />
                            <span className="node-title">Guide</span>
                            <span className="node-title-nep">निर्देशन</span>
                        </button>
                    </div>

                    <div className="clickable">
                        <button className="node-but animate-pop-up delay-5" onClick={()=> setActiveTab('Symptoms')}>
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
                            <button className="back-btn" onClick={() => setActiveTab('home')}>← Back</button>
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
                            <button className="back-btn" onClick={() => setActiveTab('home')}>← Back</button>
                            <div className="map-header-title">निर्देशन</div>
                        </header>
                    </div>   
                )}

                {ActiveTab === 'Symptoms' && (
                    <div className="screen-wrapper specialist">
                        <header className="floating-header">
                            <button className="back-btn" onClick={() => setActiveTab('home')}>← Back</button>
                            <div className="map-header-title">लक्षणहरू</div>
                        </header>
                    </div>   
                )}


            <div className="bot">
                <nav className="navigation-bar-bot">
                    {/* The sliding bar is anchored here */}
                    <div className={`bar ${ActiveTab === 'record' ? 'record' : ActiveTab === 'account' ? 'account' : 'home'}`}></div>
                    
                    <button 
                        className={ActiveTab === 'home' ? 'nav-item-active' : ''} 
                        onClick={() => setActiveTab('home')}
                    >
                        Home
                    </button>
                    <button 
                        className={ActiveTab === 'record' ? 'nav-item-active' : ''} 
                        onClick={() => setActiveTab('record')}
                    >
                        Records
                    </button>
                    <button 
                        className={ActiveTab === 'account' ? 'nav-item-active' : ''} 
                        onClick={() => setActiveTab('account')}
                    >
                        Account
                    </button>
                </nav>
            </div>
        </div>
    );
}

export default App;