import { useState } from "react";
import { Hospital, Stethoscope, MapPin, Compass, Activity, Info } from 'lucide-react';
import "./App.css";
import bell from './assets/bell.png';

function App() {
    const [NodeCount, setNodeCount] = useState(1);

    const [ActiveTab , setActiveTab] = useState('home');

    const [Translate , setTranslate] = useState('bar');

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

    return (
        <div className="app_contain">
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
                <button className="but animate-pop-up delay-1" onClick={press_append}>
                    <Hospital size={28} color="#ffffff" className="hospital-icon"/>
                    <div className="btn-text-group">
                        <h1 className="title1">Emergency Sewa</h1> 
                        <p className="dis1">आपतकालीन सेवा</p>
                    </div>
                </button>

                <br />
                <div className="grid-container">
                    <button className="node-but animate-pop-up delay-2 " onClick={() => setActiveTab('Specialist')}>
                        <Stethoscope size={32} className="node-icon clinic-color" />
                        <span className="node-title">Specialists</span>
                        <span className="node-title-nep">विशेषज्ञ</span>
                    </button>
                    <button className="node-but animate-pop-up delay-3" onClick={() => setActiveTab('Locate')}>
                        <MapPin size={32} className="node-icon map-color" />
                        <span className="node-title">Nearby</span>
                        <span className="node-title-nep">नजिकै</span>
                    </button>
                    <button className="node-but animate-pop-up delay-4" onClick={() => setActiveTab('Guide')}>
                        <Compass size={32} className="node-icon guide-color" />
                        <span className="node-title">Guide</span>
                        <span className="node-title-nep">निर्देशन</span>
                    </button>
                    <button className="node-but animate-pop-up delay-5" onClick={()=> setActiveTab('Symptoms')}>
                        <Activity size={32} className="node-icon symptom-color" />
                        <span className="node-title">Symptoms</span>
                        <span className="node-title-nep">लक्षणहरू</span>
                    </button>
                </div> 

                <br />
                <div>
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
                    <br />
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
                    <div className="main-container">
                        <h1>Specialists</h1>
                    </div>    
                )}

                {ActiveTab === 'Locate' && (
                    <div className="main-container">
                        <h1>Locate</h1>
                    </div>    
                )}

                {ActiveTab === 'Guide' && (
                    <div className="main-container">
                        <h1>Guide</h1>
                    </div>    
                )}

                {ActiveTab === 'Symptoms' && (
                    <div className="main-container">
                        <h1>Symptoms</h1>
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