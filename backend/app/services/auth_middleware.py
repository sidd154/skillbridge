from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os

security = HTTPBearer()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    jwt_secret = os.environ.get("SUPABASE_JWT_SECRET")
    
    if not jwt_secret:
        # In a generic environment without the secret loaded, we might bypass or error.
        raise HTTPException(status_code=500, detail="JWT Configuration Error")
        
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], audience="authenticated")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(payload: dict = Depends(verify_jwt)):
    # Returns the user ID extracted from the Supabase JWT
    return payload.get("sub")
