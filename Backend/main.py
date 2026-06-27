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
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Account with this phone number already exists."
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
