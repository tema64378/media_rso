use jsonwebtoken::{EncodingKey, DecodingKey, Header, Validation, encode, decode, TokenData};
use serde::{Serialize, Deserialize};
use chrono::{Utc, Duration};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}

pub fn generate_jwt(user_id: i64, role: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let now = Utc::now().timestamp() as usize;
    let exp = (Utc::now() + Duration::hours(24)).timestamp() as usize;
    let claims = Claims { sub: user_id.to_string(), role: role.to_string(), exp, iat: now };
    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref()))
}

pub fn decode_jwt(token: &str) -> Result<TokenData<Claims>, jsonwebtoken::errors::Error> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    decode::<Claims>(token, &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
}
