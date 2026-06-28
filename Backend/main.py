import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient


#Load env variable
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")
#mongodb url from env
MONGODB_URL = os.getenv("MONGODB_URL")
app = FastAPI()

if not MONGODB_URL:
    raise RuntimeError("MONGODB_URL environment variable is missing!")

#connects
client = AsyncIOMotorClient(MONGODB_URL)
db = client.medi_sewa_db            
users_collection = db.users
notifications_collection = db.notifications

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserData(BaseModel):
    fullName: str
    address: str
    phone: str
    gender: str

phone = None;

@app.post("/api/login")
async def recieve_data(data: UserData):
    global phone
    try:
        # data is automatically validated by FastAPI here!
        print(f"Received data object: {data}")
        
        #Convert the Pydantic data object into a standard Python dictionary
        user_dictionary = data.model_dump()
        incoming_phone = user_dictionary["phone"].strip()
        xisting_user = await users_collection.find_one({"phone": incoming_phone})

        if not xisting_user:
            result = await users_collection.insert_one(user_dictionary)#sends data to db
            user_dictionary["_id"] = str(result.inserted_id)
            phone = incoming_phone
            return {"status": "success", "user": user_dictionary}
        else:
            if xisting_user["fullName"].lower() == data.fullName.lower():
                xisting_user["_id"] = str(xisting_user["_id"])
                phone = incoming_phone
                return {
                    "status": "success",
                    "message": "Login successful", 
                    "user": xisting_user
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="यो फोन नम्बर अर्कै नाममा दर्ता भइसकेको छ। (This phone number is registered under a different name.)"
                )

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error processing request: {str(e)}"
        )
    

@app.get('/api/login-send')
async def send_data(phone: str):
    try:
        if phone is None:
            raise HTTPException(status_code=400, detail="No session found.")
        #Clean up any whitespaces
        search_phone = phone.strip()
        
        if not search_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number parameter is required."
            )
        
        # Search the exact phone and extract all the data
        user_data = await users_collection.find_one({"phone": search_phone})
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="No account found with this phone number."
            )
        
        user_data["_id"] = str(user_data["_id"])
        return {"status": "success", "user": user_data}
          
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database lookup error: {str(e)}"
        )


@app.get('/api/notifications')
async def get_notifications():
    try:
        notifications = []
        
        
        count = await notifications_collection.count_documents({})
        
        if count == 0:
          
            await notifications_collection.insert_many([
                {
                    "title": "स्वास्थ्य शिविर सम्बन्धी जानकारी",
                    "details": "आउँदो शनिबार बिहान १० बजेदेखि स्थानीय स्वास्थ्य चौकीमा नि:शुल्क स्वास्थ्य परीक्षण शिविर सञ्चालन हुँदैछ।"
                },
                {
                    "title": "नयाँ लक्षणहरू अपडेट गरियो",
                    "details": "मौसम परिवर्तनसँगै फैलिन सक्ने केही नयाँ भाइरल ज्वरोका लक्षणहरू एपमा थपिएका छन्।"
                },
                {
                    "title": "परामर्श सेवा उपलब्ध",
                    "details": "अब तपाईंले एपमार्फत सिधै विशेषज्ञ डाक्टरहरूसँग अनलाइन परामर्श लिन सक्नुहुनेछ। आफ्नो अनुकूल समय बुक गर्न 'Specialist' ट्याबमा जानुहोस्।"
                },
                {
                    "title": "तपाईंको प्रोफाइल अपडेट भयो",
                    "details": "तपाईंको स्वास्थ्य सम्बन्धी रेकर्ड र व्यक्तिगत विवरणहरू सफलतापूर्वक सुरक्षित गरिएका छन्।"
                },
                {
                    "title": "डेंगी रोग सम्बन्धी सतर्कता",
                    "details": "तपाईंको क्षेत्रमा डेंगीको जोखिम बढेको पाइएकाले झुलको प्रयोग गर्न र घरको वरिपरि पानी जम्न नदिन अनुरोध गरिन्छ।"
                },
                {
                    "title": "खोप कार्यक्रमको सूचना",
                    "details": "आउँदो हप्ता ५ वर्ष मुनिका बालबालिकाहरूका लागि भिटामिन 'ए' र फोलिक एसिड खुवाउने कार्यक्रम स्वास्थ्य चौकीमा हुँदैछ।"
                },
                {
                    "title": "पिउने पानीको शुद्धीकरण",
                    "details": "वर्षायाममा पानीजन्य रोगहरू फैलन सक्ने हुनाले पानी उमालेर वा फिल्टर गरेर मात्र पिउनु हुन हार्दिक अनुरोध छ।"
                }
            ])
        
        
        cursor = notifications_collection.find({})
        async for document in cursor:
            document["_id"] = str(document["_id"])  
            notifications.append({
                "title": document.get("title", "No Title"),
                "details": document.get("details", "No Details")
            })
            
        return {"status": "success", "notifications": notifications}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database lookup error: {str(e)}"
        )